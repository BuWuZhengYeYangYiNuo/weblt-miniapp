<template>
  <div class="msg-content">
    <div v-for="(seg, i) in segments" :key="i" class="msg-seg">
      <text v-if="seg.type === 'text'" class="msg-text">{{ seg.value }}</text>
      <text v-else-if="seg.type === 'bold'" class="msg-bold">{{ seg.value }}</text>
      <text v-else-if="seg.type === 'underline'" class="msg-underline">{{ seg.value }}</text>
      <image
        v-else-if="seg.type === 'image'"
        class="msg-image"
        :src="seg.value"
        resize="contain"
      ></image>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import url('./MessageItem.less');
</style>

<script>
import MessageItem from './MessageItem';
export default MessageItem;
</script>
