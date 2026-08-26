<template>
  <div class="login-page">
    <div class="login-header">
      <text class="login-title">WebLT Chat</text>
      <text class="login-subtitle">登录</text>
    </div>

    <!--
      登录表单：使用 native <input> + v-model（看得到 cursor 和已输入文本）
      @focus 弹自绘 Keyboard，不依赖 OS 输入法
    -->
    <div class="login-form">
      <input
        class="login-input"
        type="text"
        placeholder="用户名"
        v-model="username"
        @focus="openKeyboard('username')"
      />
      <input
        class="login-input"
        type="password"
        placeholder="密码"
        v-model="password"
        @focus="openKeyboard('password')"
      />
    </div>

    <!-- 登录按钮：v-if 关键盘时隐藏，避免遮挡"确定"键 -->
    <div class="login-btn" v-if="!showKeyboard" @click="handleSubmit">
      <text class="login-btn-text">登录</text>
    </div>

    <!-- 自绘键盘：fixed bottom 0，z-index 200 -->
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