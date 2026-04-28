<template>
    <canvas id="chess-overlay"></canvas>
</template>

<script setup lang="ts">

import { computed, ref, onMounted } from 'vue';

const canvas = ref();
const ctx = ref();
const squareSize = computed(() => {
  return (canvas.value.width / 8)
});

const squareToPixel = (square) => {
  const file = square.charCodeAt(0) - 97 // a=0
  const rank = 8 - parseInt(square[1])   // invert Y

  return {
    x: file * squareSize.value + squareSize.value / 2,
    y: rank * squareSize.value + squareSize.value / 2
  }
};

function drawArrow(from, to) {
  const start = squareToPixel(from)
  const end = squareToPixel(to)

  console.log('draw arrow:', from, to)

  ctx.value.beginPath()
  ctx.value.moveTo(start.x, start.y)
  ctx.value.lineTo(end.x, end.y)

  ctx.value.lineWidth = 4
  ctx.value.strokeStyle = 'red'
  ctx.value.stroke()

  // arrow head
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const size = 10

  console.log('ctx:', ctx.value)

  console.log('angle:', angle)

  ctx.value.beginPath()
  ctx.value.moveTo(end.x, end.y)
  ctx.value.lineTo(
    end.x - size * Math.cos(angle - Math.PI / 6),
    end.y - size * Math.sin(angle - Math.PI / 6)
  )
  ctx.value.lineTo(
    end.x - size * Math.cos(angle + Math.PI / 6),
    end.y - size * Math.sin(angle + Math.PI / 6)
  )
  ctx.value.closePath()
  ctx.value.fillStyle = 'red'
  ctx.value.fill()
}

const clearCanvas = () => {
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
}

// pass props with all pieces at notation:
// then board pieces consume this notation
// then position or put classes on pieces

onMounted(() => {

  canvas.value = document.getElementById('chess-overlay')

  ctx.value = canvas.value.getContext('2d')

  canvas.value.width = 400
  canvas.value.height = 400

  //squareSize.value = canvas.width / 8

  drawArrow('e2', 'e4')
})

</script>

<style>
#chess-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none; /* allows clicks through */

  width: 400px;
  height: 400px;

  z-index: 9999;
}
</style>
