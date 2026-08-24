import { defineComponent } from 'vue'
import MessageItem from '../../components/MessageItem.vue'
import Keyboard from '../../components/Keyboard.vue'
import { api, showToast } from '../../lib/api'
import { getUser, setUser, clearAuth, initAuth } from '../../lib/store'

export default defineComponent({
  components: { MessageItem, Keyboard },

  data() {
    return {
      userInfo: getUser() || { id: '', uid: '', username: '', nickname: '', points: 0 },
      activeTab: 'public' as string,
      messageInput: '',
      keyboardTarget: '' as 'message' | 'popup' | '',

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
      // 当前键盘高度（Keyboard 组件 emit 'height' 更新），用于把 chat-input-bar 顶到键盘上方
      keyboardHeight: 0,
    }
  },

  computed: {
    contentHeight(): number {
      // 聊天内容区高度：屏高 - topbar - input-bar(32) - 公告(20) - 键盘高度
      // 键盘弹起时内容区主动缩小，让 input-bar 上移到键盘上方时仍能显示消息
      let h = 260 - 28 - 32
      if (this.announcement) h -= 20
      // 键盘弹起时减 kbHeight，但保底 28 让消息区域始终可见
      h = Math.max(28, h - this.keyboardHeight)
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
    this.keyboardTarget = ''
    // 清掉键盘高度，否则切回聊天页时 input-bar 仍被顶起
    this.keyboardHeight = 0
  },

  onUnload() {
    if (this.pollTimer) {
      this.$page.clearInterval(this.pollTimer)
      this.pollTimer = 0
    }
    this.keyboardTarget = ''
    this.keyboardHeight = 0
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

    // 输入框聚焦：原生 input 不会自动弹系统输入法，弹出自绘键盘
    focusMessageInput() {
      this.keyboardTarget = 'message'
    },

    focusPopupInput() {
      this.keyboardTarget = 'popup'
    },

    closeKeyboard() {
      this.keyboardTarget = ''
      // 关闭键盘时同步把 input-bar 顶高度清零，否则 input-bar 仍被顶着
      this.keyboardHeight = 0
    },

    // 键盘上屏一个字符/汉字：回填到对应目标
    onKeyboardInput(ch: string) {
      if (this.keyboardTarget === 'popup') {
        this.popupInput += ch
      } else if (this.keyboardTarget === 'message') {
        this.messageInput += ch
      }
    },

    // 键盘退格：删除对应目标最后一个字符
    onKeyboardBack() {
      if (this.keyboardTarget === 'popup') {
        this.popupInput = this.popupInput.slice(0, -1)
      } else if (this.keyboardTarget === 'message') {
        this.messageInput = this.messageInput.slice(0, -1)
      }
    },

    // 键盘「确定」：收起自绘键盘
    onKeyboardConfirm() {
      this.keyboardTarget = ''
      this.keyboardHeight = 0
    },

    // 键盘高度变化（来自 Keyboard 组件 emit 'height'）：用于把输入栏顶到键盘上方
    onKeyboardHeight(h: number) {
      this.keyboardHeight = h
    },

    switchTab(tab: string) {
      // 切 tab 时关闭自绘键盘（避免键盘一直浮在屏上挡内容）
      this.keyboardTarget = ''
      this.activeTab = tab
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
      try {
        const data = await api.getPrivateMessages(this.selectedFriend.id, 100)
        this.friendMessages = data || []
      } catch {}
    },

    selectFriend(f: any) {
      this.selectedFriend = f
      this.selectedGroup = null
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
      try {
        const data = await api.getGroupMessages(this.selectedGroup.id, 100)
        this.groupMessages = data || []
      } catch {}
    },

    selectGroup(g: any) {
      this.selectedGroup = g
      this.selectedFriend = null
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

    senderLabel(msg: any): string {
      return (msg.sender_role === 'admin' ? '★ ' : '') + (msg.sender_nickname || msg.sender_name || '?')
    },

    showCreateGroup() {
      this.showSearch = false
      this.showJoin = false
      this.showCreate = true
      this.popupInput = ''
      // 关闭 message 键盘，强制切换到 popup 模式
      if (this.keyboardTarget === 'message') this.keyboardTarget = ''
    },

    showJoinGroup() {
      this.showSearch = false
      this.showCreate = false
      this.showJoin = true
      this.popupInput = ''
      if (this.keyboardTarget === 'message') this.keyboardTarget = ''
    },

    openSearch() {
      this.showCreate = false
      this.showJoin = false
      this.showSearch = true
      this.popupInput = ''
      if (this.keyboardTarget === 'message') this.keyboardTarget = ''
    },

    closePopup() {
      this.showSearch = false
      this.showCreate = false
      this.showJoin = false
      this.popupInput = ''
      // 关闭 popup 键盘，并清掉 input-bar 顶高度
      this.keyboardTarget = ''
      this.keyboardHeight = 0
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
        this.searchResult = null
      } catch (err: any) {
        showToast(err.message)
      }
    },

    // 发送消息
    async sendMessage() {
      const content = this.messageInput.trim()
      if (!content) {
        showToast('消息不能为空')
        return
      }

      try {
        if (this.activeTab === 'public') {
          await api.sendPublicMessage(content, false)
          await this.loadPublicMessages()
        } else if (this.activeTab === 'friends' && this.selectedFriend) {
          await api.sendPrivateMessage(this.selectedFriend.id, content)
          await this.loadFriendMessages()
        } else if (this.activeTab === 'groups' && this.selectedGroup) {
          await api.sendGroupMessage(this.selectedGroup.id, content)
          await this.loadGroupMessages()
        }
        this.messageInput = ''
        showToast('已发送')
      } catch (err: any) {
        showToast(err.message || '发送失败')
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
