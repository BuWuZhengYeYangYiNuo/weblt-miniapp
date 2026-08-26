<template>
  <div class="login-page">
    <div class="login-header">
      <text class="login-title">WebLT Chat</text>
      <text class="login-subtitle">登录</text>
    </div>

    <!-- 触发系统软键盘：
         1. native input @focus 调用 ScanInput.showKeyboard() 弹起系统软键盘
         2. 系统软键盘输入的字符通过 scan_input 事件追加到对应字段
         3. v-model 仍然绑定（fallback 时 native input 直接输入字符） -->
    <div class="login-form">
      <input
        class="login-input"
        type="text"
        placeholder="输入用户名"
        v-model="username"
        return-key-type="next"
        @focus="onInputFocus('username')"
      />

      <input
        class="login-input"
        type="password"
        placeholder="输入密码"
        v-model="password"
        return-key-type="done"
        @focus="onInputFocus('password')"
      />
    </div>

    <!-- 登录按钮 -->
    <div class="login-btn" @click="handleSubmit">
      <text class="login-btn-text">登录</text>
    </div>

    <!-- 兜底错误显示 -->
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
import index from './index';
export default {
  ...index,
};
</script>