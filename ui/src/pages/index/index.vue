<template>
  <div class="login-page">
    <div class="login-header">
      <text class="login-title">WebLT Chat</text>
      <text class="login-subtitle">登录</text>
    </div>

    <!--
      登录表单：用户名/密码各自有"用系统输入法输入"按钮，点击会调起
      有道输入法 app，回传的文本会进入对应字段。
      native input 保留作为初始内容显示（@click 触发 IME）。
    -->
    <div class="login-form">
      <div class="login-row">
        <text class="login-input-display">{{ username || '点击右侧按钮用系统输入法输入用户名' }}</text>
        <div class="login-ime-btn" @click="openImeFor('username')">
          <text class="login-ime-btn-text">输入法</text>
        </div>
      </div>

      <div class="login-row">
        <text class="login-input-display">{{ password ? '*'.repeat(password.length) : '点击右侧按钮用系统输入法输入密码' }}</text>
        <div class="login-ime-btn" @click="openImeFor('password')">
          <text class="login-ime-btn-text">输入法</text>
        </div>
      </div>
    </div>

    <!-- 登录按钮 -->
    <div class="login-btn" @click="handleSubmit">
      <text class="login-btn-text">登录</text>
    </div>

    <!-- 调试按钮：固定在右上角，点开看 imeEventLog 哪些事件触发了 -->
    <div class="debug-btn" @click="showDebug = !showDebug">
      <text class="debug-btn-text">调试({{ imeEventLog.length }})</text>
    </div>

    <!-- 错误全屏遮罩 -->
    <div
      v-if="statusText"
      class="login-status"
      @click="statusText = ''"
    >
      <text class="login-status-text">{{ statusText }}</text>
      <text class="login-status-hint">点击任意处关闭</text>
    </div>

    <!-- 系统输入法结果展示：全屏置顶 z-index 9999 ——
         用户原则："全屏置顶显示从那个传回方法获取到的文本" -->
    <div
      v-if="imeResult"
      class="ime-result-overlay"
      @click="dismissImeResult"
    >
      <text class="ime-result-label">系统输入法返回（来自：{{ imeResult.source }}）</text>
      <text class="ime-result-text">{{ imeResult.text }}</text>

      <div class="ime-result-actions">
        <div class="ime-result-btn" @click.stop="applyImeResult('username')">
          <text class="ime-result-btn-text">填入用户名</text>
        </div>
        <div class="ime-result-btn" @click.stop="applyImeResult('password')">
          <text class="ime-result-btn-text">填入密码</text>
        </div>
        <div class="ime-result-btn ime-result-btn-close" @click.stop="dismissImeResult">
          <text class="ime-result-btn-text">关闭</text>
        </div>
      </div>

      <text class="ime-result-raw">{{ imeResult.raw ? JSON.stringify(imeResult.raw) : '' }}</text>
      <text class="ime-result-hint">点击背景关闭</text>
    </div>

    <!-- 调试面板：滚动列出所有 $falcon.on 触发的事件 -->
    <div
      v-if="showDebug"
      class="debug-panel"
      @click="showDebug = false"
    >
      <text class="debug-panel-title">事件流（最近 {{ imeEventLog.length }} 条）</text>
      <div class="debug-panel-poll" @click.stop="stopPolling">
        <text class="debug-panel-poll-text">停止轮询</text>
      </div>
      <scroller class="debug-panel-scroller" scroll-y show-scrollbar>
        <div
          v-for="(e, i) in imeEventLog"
          :key="i"
          class="debug-panel-row"
        >
          <text class="debug-panel-event">{{ e.event }}</text>
          <text class="debug-panel-data">{{ e.data ? JSON.stringify(e.data) : '' }}</text>
        </div>
        <div v-if="imeEventLog.length === 0" class="debug-panel-empty">
          <text class="debug-panel-empty-text">还没有事件触发。点上面的"输入法"按钮试试。</text>
        </div>
      </scroller>
      <text class="debug-panel-hint">点击任意处关闭</text>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import url('./index.less');
</style>

<script>
import index from './index';
export default {
  ...index,
};
</script>
