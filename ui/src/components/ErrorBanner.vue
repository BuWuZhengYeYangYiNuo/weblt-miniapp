<template>
  <div class="error-banner-mask" v-if="visible" @click="dismiss">
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