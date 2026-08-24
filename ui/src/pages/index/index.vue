<template>
  <div class="login-page">
    <div class="login-header">
      <text class="login-title">WebLT Chat</text>
      <text class="login-subtitle">{{ isRegister ? '注册账号' : '登录' }}</text>
    </div>

    <div class="login-form">
      <div class="login-field">
        <text class="login-label">用户名</text>
        <input class="login-input" type="text" placeholder="输入用户名" v-model="username" />
      </div>

      <div class="login-field">
        <text class="login-label">密码</text>
        <input class="login-input" type="password" placeholder="输入密码" v-model="password" />
      </div>

      <div class="login-field" v-if="isRegister">
        <text class="login-label">邮箱</text>
        <input class="login-input" type="text" placeholder="输入邮箱" v-model="email" />
      </div>

      <div class="login-field login-field-code" v-if="isRegister">
        <text class="login-label">验证码</text>
        <input class="login-input" type="text" placeholder="输入验证码" v-model="code" />
        <div class="login-code-btn" @click.stop="sendCode">
          <text class="login-code-text">{{ codeSent ? '已发送' : '发送' }}</text>
        </div>
      </div>

      <div class="login-btn" @click="handleSubmit">
        <text class="login-btn-text">{{ isRegister ? '注册' : '登录' }}</text>
      </div>

      <div class="login-switch" @click="toggleMode">
        <text class="login-switch-text">{{ isRegister ? '已有账号？登录' : '没有账号？注册' }}</text>
      </div>

      <div class="login-status" v-if="statusText">
        <text class="login-status-text">{{ statusText }}</text>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import url('./index.less');
</style>

<script>
import index from './index';
export default index;
</script>
