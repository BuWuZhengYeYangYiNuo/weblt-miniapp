<template>
  <div class="login-page">
    <div class="login-header">
      <text class="login-title">WebLT Chat</text>
      <text class="login-subtitle">{{ isRegister ? '注册账号' : '登录' }}</text>
    </div>

    <!-- 字段用 scroller 装（5字段总高 > 中间区域，必要时滚动）。
         bubble="true" 让 precompiler 知道子元素 click 不应被 stop 替换为 $stopOuterA。
         absolute 布局 + 显式 height 由 less 控制，避免 flex 列容器里高度塌陷。 -->
    <scroller
      class="login-form"
      scroll-y
      show-scrollbar
      bubble="true"
    >
      <div class="login-field" @click="focusField('username')">
        <text class="login-label">用户名</text>
        <text class="login-value" v-if="username">{{ username }}</text>
        <text class="login-placeholder" v-else>输入用户名</text>
      </div>

      <div class="login-field" @click="focusField('password')">
        <text class="login-label">密码</text>
        <text class="login-value" v-if="password">{{ '•'.repeat(password.length) }}</text>
        <text class="login-placeholder" v-else>输入密码</text>
      </div>

      <div class="login-field" v-if="isRegister" @click="focusField('email')">
        <text class="login-label">邮箱</text>
        <text class="login-value" v-if="email">{{ email }}</text>
        <text class="login-placeholder" v-else>输入邮箱</text>
      </div>

      <div class="login-field login-field-code" v-if="isRegister">
        <text class="login-label">验证码</text>
        <text class="login-value" v-if="code">{{ code }}</text>
        <text class="login-placeholder" v-else>输入验证码</text>
        <div class="login-code-btn" @click.stop="sendCode">
          <text class="login-code-text">{{ codeSent ? '已发送' : '发送' }}</text>
        </div>
      </div>

      <div class="login-switch" @click="toggleMode">
        <text class="login-switch-text">{{ isRegister ? '已有账号？登录' : '没有账号？注册' }}</text>
      </div>

      <div class="login-status" v-if="statusText">
        <text class="login-status-text">{{ statusText }}</text>
      </div>
    </scroller>

    <!-- 登录按钮：键盘不弹时显示，键盘弹起时隐藏（避免遮挡键盘底部的"确定"键），
         键盘消失后按钮重新出现，用户点登录；这样既能保证按钮可见又不挡键盘 -->
    <div v-if="!keyboardVisible" class="login-btn" @click="handleSubmit">
      <text class="login-btn-text">{{ isRegister ? '注册' : '登录' }}</text>
    </div>

    <!-- 自绘键盘：点击任意输入框后从底部弹出 -->
    <Keyboard
      v-if="keyboardVisible"
      class="login-keyboard"
      @input="onKeyboardInput"
      @back="onKeyboardBack"
      @confirm="onKeyboardConfirm"
    />
  </div>
</template>

<style lang="less" scoped>
@import url('./index.less');
</style>

<script>
import index from './index';
import Keyboard from '../../components/Keyboard.vue';
export default {
  ...index,
  components: {
    Keyboard,
  },
};
</script>
