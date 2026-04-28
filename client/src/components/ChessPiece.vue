
<template>
  <div
    class="board-piece chess-piece"
  >
  <img src="/JohnPablok Cburnett Chess set/SVG No shadow/b_bishop_svg_NoShadow.svg">

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
}

.chess-piece {
  width: 45px;
  height: 45px;
  display: inline-block;
  margin: 2px 2px 2px 2px;

  position: absolute;
  z-index: 9991;
}
</style>
