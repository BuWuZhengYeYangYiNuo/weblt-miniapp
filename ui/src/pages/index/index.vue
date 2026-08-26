<template>
  <div class="login-page">
    <div class="login-header">
      <text class="login-title">WebLT Chat</text>
      <text class="login-subtitle">{{ isRegister ? '注册账号' : '登录' }}</text>
    </div>

    <!-- 改用系统输入法：原生 <input> + v-model，focus 自动弹系统 IME。
         之前自绘 Keyboard 在词典笔这个运行环境里调系统输入法不生效（焦点/IME 模块不稳），
         改回 native input 是用户明确要求：系统输入法能用就别自绘。 -->
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

      <input
        v-if="isRegister"
        class="login-input"
        type="text"
        placeholder="输入邮箱"
        v-model="email"
        return-key-type="next"
      />

      <div class="login-code-row" v-if="isRegister">
        <input
          class="login-input login-input-code"
          type="text"
          placeholder="验证码"
          v-model="code"
          return-key-type="done"
        />
        <div class="login-code-btn" @click="sendCode">
          <text class="login-code-text">{{ codeSent ? '已发送' : '发送' }}</text>
        </div>
      </div>
    </div>

    <!-- 登录按钮：始终显示（不再跟键盘联动了，因为现在用系统输入法，键盘由 native 控制） -->
    <div class="login-btn" @click="handleSubmit">
      <text class="login-btn-text">{{ isRegister ? '注册' : '登录' }}</text>
    </div>

    <div class="login-switch" @click="toggleMode">
      <text class="login-switch-text">{{ isRegister ? '已有账号？登录' : '没有账号？注册' }}</text>
    </div>

    <!-- 错误全屏遮罩：直接盖住整个屏幕（用户要求：直接全屏显示错误） -->
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