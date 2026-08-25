<template>
  <!-- 置顶居中错误提示：词典笔屏 260px 高，原生 toast 在底部看不见。
       z-index 500 永远是页面最高层（高于登录按钮 260 / popup）。
       banner 自身允许点击 dismiss，下方空白不拦截事件。 -->
  <div class="error-banner-root" v-if="visible" @click="dismiss">
    <div class="error-banner">
      <text class="error-banner-text">{{ msg }}</text>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import url('./ErrorBanner.less');
</style>

<script>
import ErrorBanner from './ErrorBanner';
export default ErrorBanner;
</script>
