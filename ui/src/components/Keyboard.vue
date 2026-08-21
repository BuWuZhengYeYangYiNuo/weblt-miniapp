<template>
  <div class="kb-container">
    <div class="kb-row" v-for="(row, ri) in currentRows" :key="ri">
      <div
        v-for="key in row"
        :key="key.id"
        class="kb-key"
        :class="key.cls"
        @click="onKeyTap(key)"
      >
        <text class="kb-label">{{ key.display }}</text>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import url('./Keyboard.less');
</style>

<script>
import Keyboard from './Keyboard';
export default Keyboard;
</script>
