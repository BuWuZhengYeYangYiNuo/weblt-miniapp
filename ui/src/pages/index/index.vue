<template>
  <div class="login-page">
    <div class="login-header">
      <text class="login-title">WebLT Chat</text>
      <text class="login-subtitle">登录</text>
    </div>

    <!-- 改用系统输入法：原生 <input> + v-model，focus 自动弹系统 IME -->
    <div class="login-form">
      <input
        class="login-input"
        type="text"
        placeholder="输入用户名"
        v-model="username"
        return-key-type="next"
      />

      <input
        class="login-input"
        type="password"
        placeholder="输入密码"
        v-model="password"
        return-key-type="done"
      />
    </div>

    <!-- 登录按钮 -->
    <div class="login-btn" @click="handleSubmit">
      <text class="login-btn-text">登录</text>
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