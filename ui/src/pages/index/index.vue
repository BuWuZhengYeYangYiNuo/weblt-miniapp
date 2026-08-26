<template>
  <div class="login-page">
    <div class="login-header">
      <text class="login-title">WebLT Chat</text>
      <text class="login-subtitle">登录</text>
    </div>

    <!--
      登录表单：用户名/密码行点一下弹出自绘 Keyboard（不依赖 OS 输入法 / native focus）。
      整段拼完点"确定"键 → 关键盘。
    -->
    <div class="login-form">
      <div class="login-row" @click="openKeyboard('username')">
        <text class="login-input-display">{{ username || '点击输入用户名' }}</text>
      </div>

      <div class="login-row" @click="openKeyboard('password')">
        <text class="login-input-display">{{ password ? '*'.repeat(password.length) : '点击输入密码' }}</text>
      </div>
    </div>

    <!-- 登录按钮（v-if 关键盘时隐藏，避免遮挡"确定"键）-->
    <div class="login-btn" v-if="!showKeyboard" @click="handleSubmit">
      <text class="login-btn-text">登录</text>
    </div>

    <!-- 自绘键盘：fixed 在底部，z-index 200 -->
    <div class="kb-wrapper" v-if="showKeyboard">
      <Keyboard
        @input="onKbInput"
        @back="onKbBack"
        @enter="onKbEnter"
        @confirm="onKbConfirm"
      />
    </div>

    <!-- 错误全屏遮罩 z-index 10000 -->
    <div
      v-if="statusText"
      class="login-status"
      @click="statusText = ''"
    >
      <text class="login-status-text">{{ statusText }}</text>
      <text class="login-status-hint">点击任意处关闭</text>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import url('./index.less');
</style>

<script>
import Keyboard from '../../components/Keyboard.vue'
import index from './index';
export default {
  ...index,
  components: { Keyboard },
};
</script>