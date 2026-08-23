<template>
  <div class="kb-container">
    <!-- 中文模式：拼音预览（独立一行，显示在候选栏上方） -->
    <div class="kb-pinyin-bar" v-if="showCandidates">
      <text class="kb-pinyin-text">{{ pinyin || ' ' }}</text>
    </div>
    <!-- 候选栏（横向滚动） -->
    <div class="kb-candidate-bar" v-if="showCandidates">
      <scroller class="kb-candidates" scroll-direction="horizontal" :show-scrollbar="false">
        <div
          v-for="(ch, i) in candidates"
          :key="i"
          class="kb-candidate"
          @click="commitCandidate(ch)"
        >
          <text class="kb-candidate-text">{{ ch }}</text>
        </div>
      </scroller>
    </div>

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
