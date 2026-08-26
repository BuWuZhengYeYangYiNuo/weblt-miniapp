import { defineComponent } from 'vue'
import MessageItem from '../../components/MessageItem.vue'
import { api, showToast, setAuthFailedHandler } from '../../lib/api'
import { getUser, setUser, clearAuth, initAuth } from '../../lib/store'
import { startSystemKeyboard } from '../index/index'

export default defineComponent({
  components: { MessageItem },

  data() {
    return {
      userInfo: getUser() || { id: '', uid: '', username: '', nickname: '', points: 0 },
      activeTab: 'public' as string,
      messageInput: '',
      // 当前激活的输入目标（用系统软键盘追加字符）
      activeInput: '' as 'message' | 'popup' | '',

      // 公共
      publicMessages: [] as any[],

      // 好友
      friends: [] as any[],
      friendRequests: [] as any[],
      selectedFriend: null as any,
      friendMessages: [] as any[],

      // 群聊
      groups: [] as any[],
      selectedGroup: null as any,
      groupMessages: [] as any[],

      // 签到
      checkedIn: false,
      checkinPoints: 0,

      // 公告
      announcement: '',

      // 弹窗
      showSearch: false,
      showCreate: false,
      showJoin: false,
      popupInput: '',
      searchResult: null as any,

      // 轮询
      pollTimer: 0 as any,
      // 发送消息期间的单次锁，防止用户连点导致重复发送
      _sendLock: false,
    }
  },

  computed: {
    contentHeight(): number {
      // 聊天内容区高度：屏高 - topbar - input-bar - 公告（系统 IME 由 native 控制，不影响布局）
      let h = 260 - 28 - 32
      if (this.announcement) h -= 20
      return h
    },
    sidebarHeight(): number {
      return Math.max(28, this.contentHeight - 24)
    },
    popupVisible(): boolean {
      return this.showSearch || this.showCreate || this.showJoin
    },
    popupTitle(): string {
      if (this.showCreate) return '创建群聊'
      if (this.showJoin) return '加入群聊'
      return '搜索用户'
    },
    popupPlaceholder(): string {
      if (this.showCreate) return '输入群名称'
      if (this.showJoin) return '输入群号'
      return '输入UID'
    },
  },

  // 页面生命周期：进入前台时由 BasePage 统一调度，必须定义在选项顶层
  async onShow() {
    // 防止 onShow 重入时 setInterval 泄漏：先清掉旧的 pollTimer
    if (this.pollTimer) {
      this.$page.clearInterval(this.pollTimer)
      this.pollTimer = 0
    }
    await initAuth()
    this.userInfo = getUser() || this.userInfo
    this.checkinPoints = this.userInfo.points || 0

    try {
      const me = await api.getMe()
      this.userInfo = me
      setUser(me)
      this.checkinPoints = me.points || 0
    } catch {
      // token 失效：清掉本地凭证再跳登录页，避免 index.onShow 看到残留 token 再次跳回来形成死循环
      await clearAuth()
      $falcon.navTo('index', {})
      return
    }

    this.loadAnnouncement()
    this.loadCheckinStatus()
    this.loadPublicMessages()
    this.loadFriends()
    this.loadGroups()

    this.pollTimer = this.$page.setInterval(() => {
      this.pollData()
    }, 5000)
  },

  onHide() {
    if (this.pollTimer) {
      this.$page.clearInterval(this.pollTimer)
      this.pollTimer = 0
    }
  },

  onUnload() {
    if (this.pollTimer) {
      this.$page.clearInterval(this.pollTimer)
      this.pollTimer = 0
    }
  },

  // 注册全局 401/403 回调：token 失效时强制跳登录页（避免用户卡在 chat 页看到旧数据）
  mounted() {
    setAuthFailedHandler((err: Error) => {
      // 已经在 index 页面时不重复跳
      try {
        showToast(err.message || '登录已过期，请重新登录')
      } catch {}
      // 异步清凭证 + 跳转，避免阻塞 mounted 自身
      clearAuth().then(() => {
        try { ($falcon as any).navTo('index', {}) } catch {}
      }).catch(() => {
        try { ($falcon as any).navTo('index', {}) } catch {}
      })
    })
  },

  methods: {
    pollData() {
      if (this.activeTab === 'public') {
        this.loadPublicMessages()
      } else if (this.activeTab === 'friends' && this.selectedFriend) {
        this.loadFriendMessages()
      } else if (this.activeTab === 'groups' && this.selectedGroup) {
        this.loadGroupMessages()
      }
    },

    // 切 tab：清空旧消息避免视觉混淆（系统输入法由 native 控制，不影响）
    switchTab(tab: string) {
      this.activeTab = tab
    },

    // 触发系统软键盘：native input focus 时调
    onMessageInputFocus() {
      this.activeInput = 'message'
      startSystemKeyboard((ch) => {
        if (this.activeInput === 'message') this.messageInput += ch
        else if (this.activeInput === 'popup') this.popupInput += ch
      })
    },

    onPopupInputFocus() {
      this.activeInput = 'popup'
      // 关闭 message 输入焦点状态，避免新字符加错地方
      startSystemKeyboard((ch) => {
        if (this.activeInput === 'message') this.messageInput += ch
        else if (this.activeInput === 'popup') this.popupInput += ch
      })
    },

    formatTime(timeStr: string): string {
      try {
        const d = new Date(timeStr)
        return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
      } catch {
        return ''
      }
    },

    // 公共消息
    async loadPublicMessages() {
      try {
        const data = await api.getPublicMessages(100)
        this.publicMessages = data || []
      } catch {}
    },

    // 签到
    async loadCheckinStatus() {
      try {
        const s = await api.getCheckinStatus()
        this.checkedIn = s.checked_in
        this.checkinPoints = s.points
      } catch {}
    },

    async doCheckin() {
      try {
        const res = await api.checkin()
        showToast(res.message)
        await this.loadCheckinStatus()
      } catch (err: any) {
        showToast(err.message)
      }
    },

    // 公告
    async loadAnnouncement() {
      try {
        const data = await api.getAnnouncement()
        this.announcement = data?.announcement || ''
      } catch {}
    },

    // 好友
    async loadFriends() {
      try {
        const [f, r] = await Promise.all([api.getFriends(), api.getFriendRequests()])
        this.friends = f || []
        this.friendRequests = r || []
      } catch {}
    },

    async loadFriendMessages() {
      if (!this.selectedFriend) return
      const fid = this.selectedFriend.id
      try {
        const data = await api.getPrivateMessages(fid, 100)
        // 防止竞态：用户切到其他 friend 后慢请求才返回，覆盖正确数据
        if (this.selectedFriend && this.selectedFriend.id === fid) {
          this.friendMessages = data || []
        }
      } catch {}
    },

    selectFriend(f: any) {
      this.selectedFriend = f
      this.selectedGroup = null
      // 立即清空旧消息，避免新好友加载完前显示上一好友的消息造成视觉混淆
      this.friendMessages = []
      this.loadFriendMessages()
    },

    async handleRequest(requestId: number, action: string) {
      try {
        await api.handleFriendRequest(requestId, action)
        showToast(action === 'accepted' ? '已添加好友' : '已拒绝')
        await this.loadFriends()
      } catch (err: any) {
        showToast(err.message)
      }
    },

    // 群聊
    async loadGroups() {
      try {
        const data = await api.getMyGroups()
        this.groups = data || []
      } catch {}
    },

    async loadGroupMessages() {
      if (!this.selectedGroup) return
      const gid = this.selectedGroup.id
      try {
        const data = await api.getGroupMessages(gid, 100)
        // 防止竞态：用户切到其他 group 后慢请求才返回，覆盖正确数据
        if (this.selectedGroup && this.selectedGroup.id === gid) {
          this.groupMessages = data || []
        }
      } catch {}
    },

    selectGroup(g: any) {
      this.selectedGroup = g
      this.selectedFriend = null
      // 立即清空旧消息，避免新群加载完前显示上一群的消息造成视觉混淆
      this.groupMessages = []
      this.loadGroupMessages()
    },

    async leaveGroup() {
      const g = this.selectedGroup
      if (!g) return
      try {
        await api.leaveGroup(g.id)
        showToast('已退出群聊')
        this.selectedGroup = null
        await this.loadGroups()
      } catch (err: any) {
        showToast(err.message)
      }
    },

    async disbandGroup() {
      const g = this.selectedGroup
      if (!g) return
      try {
        await api.disbandGroup(g.id)
        showToast('群聊已解散')
        this.selectedGroup = null
        await this.loadGroups()
      } catch (err: any) {
        showToast(err.message)
      }
    },

    // 群组 header 按钮：根据 role 调 leave/disband（避免 @click 表达式在 precompiler 中行为不确定）
    handleGroupLeaveOrDisband() {
      if (!this.selectedGroup) return
      if (this.selectedGroup.role !== 'owner') {
        this.leaveGroup()
      } else {
        this.disbandGroup()
      }
    },

    senderLabel(msg: any): string {
      return (msg.sender_role === 'admin' ? '★ ' : '') + (msg.sender_nickname || msg.sender_name || '?')
    },

    showCreateGroup() {
      this.showSearch = false
      this.showJoin = false
      this.showCreate = true
      this.popupInput = ''
    },

    showJoinGroup() {
      this.showSearch = false
      this.showCreate = false
      this.showJoin = true
      this.popupInput = ''
    },

    openSearch() {
      this.showCreate = false
      this.showJoin = false
      this.showSearch = true
      this.popupInput = ''
    },

    closePopup() {
      this.showSearch = false
      this.showCreate = false
      this.showJoin = false
      this.popupInput = ''
    },

    async confirmPopup() {
      if (this.showCreate) {
        if (!this.popupInput.trim()) return
        try {
          await api.createGroup(this.popupInput.trim())
          showToast('群聊创建成功')
          this.closePopup()
          await this.loadGroups()
        } catch (err: any) {
          showToast(err.message)
        }
      } else if (this.showJoin) {
        if (!this.popupInput.trim()) return
        try {
          await api.joinGroup(this.popupInput.trim())
          showToast('已加入群聊')
          this.closePopup()
          await this.loadGroups()
        } catch (err: any) {
          showToast(err.message)
        }
      } else {
        if (!this.popupInput.trim()) return
        try {
          const result = await api.getUserByUid(this.popupInput.trim())
          this.searchResult = result
          this.showSearch = false
          this.popupInput = ''
        } catch (err: any) {
          showToast(err.message)
        }
      }
    },

    closeSearchResult() {
      this.searchResult = null
    },

    async addFriend() {
      if (!this.searchResult) return
      try {
        await api.sendFriendRequest(this.searchResult.id)
        showToast('好友申请已发送')
        this.closeSearchResult()
      } catch (err: any) {
        showToast(err.message)
      }
    },

    // 发送消息
    async sendMessage() {
      // 防重复点击：loading 期间禁止二次点击（onSendLock 仅作单次发送内锁，不污染其他方法）
      if (this._sendLock) return
      const content = this.messageInput.trim()
      if (!content) {
        showToast('消息不能为空')
        return
      }
      this._sendLock = true
      try {
        if (this.activeTab === 'public') {
          await api.sendPublicMessage(content, false)
          await this.loadPublicMessages()
          this.messageInput = ''
          showToast('已发送')
        } else if (this.activeTab === 'friends' && this.selectedFriend) {
          await api.sendPrivateMessage(this.selectedFriend.id, content)
          await this.loadFriendMessages()
          this.messageInput = ''
          showToast('已发送')
        } else if (this.activeTab === 'groups' && this.selectedGroup) {
          await api.sendGroupMessage(this.selectedGroup.id, content)
          await this.loadGroupMessages()
          this.messageInput = ''
          showToast('已发送')
        } else {
          // activeTab 与 selectedXxx 不匹配时（如 public tab 但代码误入 else 分支、
          // 好友 tab 未选好友、群聊 tab 未选群）提示用户，保留输入不丢失
          showToast('请先选择聊天对象')
        }
      } catch (err: any) {
        showToast(err.message || '发送失败')
      } finally {
        this._sendLock = false
      }
    },

    // 退出
    async doLogout() {
      await clearAuth()
      showToast('已退出登录')
      $falcon.navTo('index', {})
    },
  },
})
