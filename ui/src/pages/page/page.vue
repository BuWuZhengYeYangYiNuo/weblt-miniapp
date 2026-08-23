<template>
  <div class="chat-page">
    <!-- 顶部栏 -->
    <div class="chat-topbar">
      <div class="chat-user" @click="switchTab('public')">
        <text class="chat-username">{{ userInfo.nickname || userInfo.username }}</text>
        <text class="chat-uid">UID:{{ userInfo.uid }}</text>
      </div>
      <div class="chat-tabs">
        <div class="chat-tab" :class="activeTab === 'public' ? 'chat-tab-active' : ''" @click="switchTab('public')">
          <text class="chat-tab-text">公共</text>
        </div>
        <div class="chat-tab" :class="activeTab === 'friends' ? 'chat-tab-active' : ''" @click="switchTab('friends')">
          <text class="chat-tab-text">好友</text>
        </div>
        <div class="chat-tab" :class="activeTab === 'groups' ? 'chat-tab-active' : ''" @click="switchTab('groups')">
          <text class="chat-tab-text">群聊</text>
        </div>
      </div>
      <div class="chat-actions">
        <text class="chat-points">积分:{{ checkinPoints }}</text>
        <div class="chat-checkin" v-if="!checkedIn" @click="doCheckin">
          <text class="chat-checkin-text">签到</text>
        </div>
        <div class="chat-logout" @click="doLogout">
          <text class="chat-logout-text">退出</text>
        </div>
      </div>
    </div>

    <!-- 公告 -->
    <div class="chat-announce" v-if="announcement">
      <text class="chat-announce-text">{{ announcement }}</text>
    </div>

    <!-- 公共聊天 -->
    <div class="chat-content" v-if="activeTab === 'public'">
      <scroller class="msg-scroller-public" scroll-y="true" :show-scrollbar="true" :style="{ height: contentHeight + 'px' }">
        <div class="msg-list">
          <div v-for="msg in publicMessages" :key="msg.id" class="msg-item">
            <text class="msg-sender" :class="{ 'msg-sender-admin': msg.sender_role === 'admin' }">{{ senderLabel(msg) }}</text>
            <text class="msg-time">{{ formatTime(msg.created_at) }}</text>
            <MessageItem :text="msg.content" />
          </div>
          <div v-if="publicMessages.length === 0" class="msg-empty">
            <text class="msg-empty-text">暂无消息</text>
          </div>
        </div>
      </scroller>
    </div>

    <!-- 好友聊天 -->
    <div class="chat-content" v-if="activeTab === 'friends'">
      <div class="chat-sidebar">
        <div class="sidebar-search" @click="openSearch">
          <text class="sidebar-search-text">搜索UID</text>
        </div>
        <scroller class="sidebar-scroller" scroll-y="true" :style="{ height: sidebarHeight + 'px' }">
          <div v-for="req in friendRequests" :key="req.id" class="sidebar-req">
            <text class="sidebar-req-name">{{ req.nickname || req.username }}</text>
            <div class="sidebar-req-btns">
              <div class="sidebar-req-accept" @click="handleRequest(req.request_id, 'accepted')">
                <text class="sidebar-req-btn-text">接</text>
              </div>
              <div class="sidebar-req-reject" @click="handleRequest(req.request_id, 'rejected')">
                <text class="sidebar-req-btn-text">拒</text>
              </div>
            </div>
          </div>
          <div v-for="f in friends" :key="f.id" class="sidebar-item" :class="selectedFriend && selectedFriend.id === f.id ? 'sidebar-item-active' : ''" @click="selectFriend(f)">
            <text class="sidebar-name">{{ f.nickname || f.username }}</text>
          </div>
          <div v-if="friends.length === 0" class="sidebar-empty">
            <text class="sidebar-empty-text">暂无好友</text>
          </div>
        </scroller>
      </div>
      <div class="chat-main" v-if="selectedFriend">
        <scroller class="msg-scroller" scroll-y="true" :show-scrollbar="true" :style="{ height: contentHeight + 'px' }">
          <div class="msg-list">
            <div v-for="msg in friendMessages" :key="msg.id" class="msg-item">
              <text class="msg-sender" :class="{ 'msg-sender-admin': msg.sender_role === 'admin' }">{{ senderLabel(msg) }}</text>
              <text class="msg-time">{{ formatTime(msg.created_at) }}</text>
              <MessageItem :text="msg.content" />
            </div>
            <div v-if="friendMessages.length === 0" class="msg-empty">
              <text class="msg-empty-text">暂无消息</text>
            </div>
          </div>
        </scroller>
      </div>
      <div class="chat-main" v-else>
        <text class="chat-placeholder">选择好友开始聊天</text>
      </div>
    </div>

    <!-- 群聊 -->
    <div class="chat-content" v-if="activeTab === 'groups'">
      <div class="chat-sidebar">
        <div class="group-actions">
          <div class="group-action" @click="showCreateGroup">
            <text class="sidebar-search-text">创建</text>
          </div>
          <div class="group-action" @click="showJoinGroup">
            <text class="sidebar-search-text">加入</text>
          </div>
        </div>
        <scroller class="sidebar-scroller" scroll-y="true" :style="{ height: sidebarHeight + 'px' }">
          <div v-for="g in groups" :key="g.id" class="sidebar-item" :class="selectedGroup && selectedGroup.id === g.id ? 'sidebar-item-active' : ''" @click="selectGroup(g)">
            <text class="sidebar-name">{{ g.name }}</text>
            <text class="sidebar-sub">{{ g.invite_code }}</text>
          </div>
          <div v-if="groups.length === 0" class="sidebar-empty">
            <text class="sidebar-empty-text">暂无群聊</text>
          </div>
        </scroller>
      </div>
      <div class="chat-main" v-if="selectedGroup">
        <div class="group-header">
          <text class="group-header-name">{{ selectedGroup.name }}</text>
          <text class="group-header-code">群号:{{ selectedGroup.invite_code }}</text>
          <div class="group-header-btn" :class="selectedGroup.role !== 'owner' ? 'group-btn-leave' : 'group-btn-disband'" @click="selectedGroup.role !== 'owner' ? leaveGroup() : disbandGroup()">
            <text class="group-btn-text">{{ selectedGroup.role !== 'owner' ? '退出' : '解散' }}</text>
          </div>
        </div>
        <scroller class="msg-scroller" scroll-y="true" :show-scrollbar="true" :style="{ height: (contentHeight - 24) + 'px' }">
          <div class="msg-list">
            <div v-for="msg in groupMessages" :key="msg.id" class="msg-item">
              <text class="msg-sender" :class="{ 'msg-sender-admin': msg.sender_role === 'admin' }">{{ senderLabel(msg) }}</text>
              <text class="msg-time">{{ formatTime(msg.created_at) }}</text>
              <MessageItem :text="msg.content" />
            </div>
            <div v-if="groupMessages.length === 0" class="msg-empty">
              <text class="msg-empty-text">暂无消息</text>
            </div>
          </div>
        </scroller>
      </div>
      <div class="chat-main" v-else>
        <text class="chat-placeholder">选择群聊开始聊天</text>
      </div>
    </div>

    <!-- 搜索/创建群 弹窗 -->
    <div class="chat-popup" v-if="popupVisible">
      <div class="popup-mask" @click="closePopup"></div>
      <div class="popup-box">
        <text class="popup-title">{{ popupTitle }}</text>
        <div class="popup-input" @click="focusPopupInput">
          <text class="popup-input-value" v-if="popupInput">{{ popupInput }}</text>
          <text class="popup-input-placeholder" v-else>{{ popupPlaceholder }}</text>
        </div>
        <div class="popup-btns">
          <div class="popup-cancel" @click="closePopup">
            <text class="popup-btn-text">取消</text>
          </div>
          <div class="popup-confirm" @click="confirmPopup">
            <text class="popup-confirm-text">确定</text>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入栏 -->
    <div class="chat-input-bar" v-if="!keyboardVisible">
      <div class="chat-input-field" @click="focusMessageInput">
        <text class="chat-input-text" v-if="messageInput">{{ messageInput }}</text>
        <text class="chat-input-placeholder" v-else>输入消息...</text>
      </div>
      <div class="chat-send-btn" @click="sendMessage">
        <text class="chat-send-text">发送</text>
      </div>
    </div>

    <!-- 系统输入法拉起中（全屏覆盖，本 app 退后台，无需自绘键盘让位） -->
    <div class="chat-input-bar chat-input-busy" v-if="keyboardVisible">
      <text class="chat-input-placeholder">系统输入法中…（完成后自动返回）</text>
    </div>

    <!-- 群创建结果/好友搜索结果弹窗 -->
    <div class="chat-popup" v-if="searchResult">
      <div class="popup-mask" @click="closeSearchResult"></div>
      <div class="popup-box">
        <text class="popup-title">搜索结果</text>
        <text class="popup-info">{{ searchResult.nickname || searchResult.username }}</text>
        <text class="popup-info">UID: {{ searchResult.uid }}</text>
        <div class="popup-btns">
          <div class="popup-cancel" @click="closeSearchResult">
            <text class="popup-btn-text">取消</text>
          </div>
          <div class="popup-confirm" @click="addFriend">
            <text class="popup-confirm-text">加好友</text>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import url('./page.less');
</style>

<script>
import page from './page';
export default page;
</script>
