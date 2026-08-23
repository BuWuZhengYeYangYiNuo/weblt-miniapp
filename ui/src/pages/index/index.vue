<template>
  <div class="login-page">
    <div class="login-header">
      <text class="login-title">WebLT Chat</text>
      <text class="login-subtitle">{{ isRegister ? '注册账号' : '登录' }}</text>
    </div>

    <div class="login-form">
      <div class="login-field" @click="focusField('username')">
        <text class="login-label">用户名</text>
        <text class="login-value" v-if="username">{{ username }}</text>
        <text class="login-placeholder" v-else>输入用户名</text>
      </div>

      <div class="login-field" @click="focusField('password')">
        <text class="login-label">密码</text>
        <text class="login-value" v-if="password">{{ maskPassword }}</text>
        <text class="login-placeholder" v-else>输入密码</text>
      </div>

      <div class="login-field" v-if="isRegister" @click="focusField('email')">
        <text class="login-label">邮箱</text>
        <text class="login-value" v-if="email">{{ email }}</text>
        <text class="login-placeholder" v-else>输入邮箱</text>
      </div>

      <div class="login-field" v-if="isRegister" @click="focusField('code')">
        <text class="login-label">验证码</text>
        <text class="login-value" v-if="code">{{ code }}</text>
        <text class="login-placeholder" v-else>输入验证码</text>
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

    <!-- 输入框聚焦时拉起系统输入法（有道输入法），不再使用自绘键盘，
         避免小屏(260px)自绘键盘溢出/裁切问题。 -->
  </div>
</template>

<style lang="less" scoped>
@import url('./index.less');
</style>

<script>
import index from './index';
export default index;
</script>
