
<template>
  <div
    class="board-piece"
  >
  <img src="/JohnPablok Cburnett Chess set/SVG No shadow/b_bishop_svg_NoShadow">

  </div>
</template>


<script setup lang="ts">
//b_bishop_svg_NoShadow


const fileUrl = new URL('/JohnPablok Cburnett Chess set/SVG No shadow/b_bishop_svg_NoShadow"', import.meta.url).href;

console.log('file url test:', fileUrl)
</script>

<style>
.board-piece {
  width: 49px;
  height: 49px;
  position: relative;
  display: inline-block;

  margin: 0 0 0 0;

  z-index: 9990
}
</style>
