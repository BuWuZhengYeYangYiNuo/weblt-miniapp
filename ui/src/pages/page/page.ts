import { defineComponent } from 'vue'
import Keyboard from '../../components/Keyboard.vue'
import MessageItem from '../../components/MessageItem.vue'
import { api, showToast } from '../../lib/api'
import { getUser, setUser, clearAuth, initAuth } from '../../lib/store'

export default defineComponent({
  components: { Keyboard, MessageItem },

  data() {
    return {
      userInfo: getUser() || { id: '', uid: '', username: '', nickname: '', points: 0 },
      activeTab: 'public' as string,
      keyboardVisible: false,
      messageInput: '',

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
      kbTarget: 'message' as 'message' | 'popup',

      // 轮询
      pollTimer: 0 as any,
    }
  },

  computed: {
    contentHeight(): number {
      let h = 260 - 28 - 28
      if (this.announcement) h -= 20
      if (this.keyboardVisible) h -= 84
      return h
    },
    sidebarHeight(): number {
      return this.contentHeight - 24
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
      clearInterval(this.pollTimer)
      this.pollTimer = 0
    }
  },

  onUnload() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = 0
    }
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

    switchTab(tab: string) {
      this.activeTab = tab
      this.keyboardVisible = false
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
      this.keyboardVisible = false
    },

    focusPopupInput() {
      this.kbTarget = 'popup'
      this.keyboardVisible = true
    },

    focusMessageInput() {
      this.kbTarget = 'message'
      this.keyboardVisible = true
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
      this.keyboardVisible = false
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
      if (!content) return

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
        this.keyboardVisible = false
      } catch (err: any) {
        showToast(err.message)
      }
    },

    // 键盘
    onKbInput(char: string) {
      if (this.kbTarget === 'popup') {
        this.popupInput += char
      } else {
        this.messageInput += char
      }
    },

    onKbBack() {
      if (this.kbTarget === 'popup') {
        this.popupInput = this.popupInput.slice(0, -1)
      } else {
        this.messageInput = this.messageInput.slice(0, -1)
      }
    },

    onKbEnter() {
      if (this.kbTarget === 'popup') {
        this.confirmPopup()
      } else {
        this.sendMessage()
      }
    },

    // 退出
    async doLogout() {
      await clearAuth()
      $falcon.navTo('index', {})
    },
  },
})
