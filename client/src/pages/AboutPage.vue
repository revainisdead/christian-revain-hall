<template>
  <q-page class="about-page q-pa-lg">
    <q-card class="about-card q-mx-auto">
      <q-card-section>
        <h1 class="text-h5 q-my-none">About BlunderProof</h1>
        <p class="q-mt-md">
          BlunderProof is a chess training tool. It breaks a position into what a strong player sees:
          where each piece can go, who controls each square, which pieces are in danger, and how a
          fight on a square plays out. The goal is a player who sees the battle before it happens.
        </p>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <h2 class="text-subtitle1 text-weight-medium q-my-none">Credits</h2>
        <ul class="q-mt-sm">
          <li>Chess rules in the browser: chess.js (BSD-2-Clause license).</li>
          <li>Chess rules on the server: python-chess (GPL-3.0 license).</li>
          <li>Piece and board art: JohnPablok's Cburnett chess set.</li>
        </ul>
      </q-card-section>

      <q-separator />

      <q-card-section id="fair-play" class="policy-section">
        <FairPlayPolicy />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import FairPlayPolicy from 'components/FairPlayPolicy.vue';
</script>

<style scoped>
.about-page {
  background: linear-gradient(135deg, #0f9b8e 0%, #1565c0 100%);
}
.about-card {
  max-width: 760px;
}
/* Low-key on the About page: the policy sits at the bottom in small print. */
.policy-section {
  font-size: 0.85rem;
  color: #555;
}
</style>
