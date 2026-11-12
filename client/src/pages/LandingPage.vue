<template>
  <q-page class="landing" data-testid="landing">
    <header class="top-bar row items-center justify-between q-px-lg q-py-md">
      <div class="brand">BlunderProof</div>
      <q-btn
        unelevated
        color="white"
        text-color="primary"
        label="Sign in"
        :to="{ name: 'login' }"
        data-testid="landing-sign-in"
      />
    </header>

    <!-- Hero: the pitch next to the demo board -->
    <section class="hero row items-center justify-center q-px-lg">
      <div class="hero-text">
        <h1>See the battle before it happens.</h1>
        <p class="lead">
          Engines tell you the best move. BlunderProof shows you <em>why</em>: where every piece
          can go, who controls each square, which of your pieces are in danger, and how a fight
          plays out. Build the picture a strong player sees, one layer at a time.
        </p>
        <q-btn
          unelevated
          size="lg"
          color="amber-7"
          text-color="black"
          label="Start training"
          :to="{ name: 'login' }"
          data-testid="landing-cta"
        />
      </div>
      <div class="hero-demo column items-center">
        <LandingDemoBoard />
        <div class="demo-caption">
          The queen on h5 is selected: <span class="key arrow">arrows</span> show where it can go,
          <span class="key ring">rings</span> mark the pieces it can take, and
          <span class="key bubble mine">2</span><span class="key bubble theirs">1</span>
          attacker bubbles count who attacks each piece.
        </div>
      </div>
    </section>

    <!-- The four training tools -->
    <section class="features q-px-lg">
      <h2>Four ways to see the board</h2>
      <div class="feature-grid">
        <q-card v-for="f in FEATURES" :key="f.title" flat class="feature">
          <q-card-section>
            <q-icon :name="f.icon" size="32px" color="primary" />
            <div class="text-subtitle1 text-weight-medium q-mt-sm">{{ f.title }}</div>
            <div class="text-body2 text-grey-8">{{ f.text }}</div>
          </q-card-section>
        </q-card>
      </div>
    </section>

    <!-- Pricing -->
    <section class="pricing q-px-lg" data-testid="pricing">
      <q-card class="price-card">
        <q-card-section class="text-center">
          <div class="text-overline">Unlimited use</div>
          <div class="price">$5</div>
          <div class="text-body2 text-grey-8 q-mb-md">
            Every training tool, every game, no limits.
          </div>
          <q-btn unelevated color="primary" label="Get started" :to="{ name: 'login' }" />
        </q-card-section>
      </q-card>
    </section>

    <!-- Fair play, in one line, with the full policy behind About -->
    <section class="fair q-px-lg text-center">
      Training only. BlunderProof never gives advice during a live game.
      <router-link :to="{ name: 'about' }" class="about-link">About and fair play</router-link>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import LandingDemoBoard from 'components/LandingDemoBoard.vue';

const FEATURES = [
  {
    icon: 'call_made',
    title: 'Move preview',
    text: 'Select a piece and see every square it can reach, with the pieces it can capture marked.',
  },
  {
    icon: 'bubble_chart',
    title: 'Attacker bubbles',
    text: 'Green and red bubbles count how many of your pieces and theirs attack each square.',
  },
  {
    icon: 'warning_amber',
    title: 'Pieces under attack',
    text: 'Your threatened pieces, most urgent first: attackers vs defenders, and what you stand to lose.',
  },
  {
    icon: 'visibility',
    title: 'Battle board',
    text: 'Play out the captures on a square and see the board once the fight is over.',
  },
];
</script>

<style scoped>
.landing {
  background: linear-gradient(135deg, #0f9b8e 0%, #1565c0 100%);
  color: #fff;
}
.brand {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.hero {
  gap: 48px;
  padding-top: 32px;
  padding-bottom: 56px;
}
.hero-text {
  max-width: 480px;
}
.hero-text h1 {
  font-size: clamp(2rem, 5vw, 3.2rem);
  line-height: 1.1;
  font-weight: 700;
  margin: 0 0 16px;
}
.lead {
  font-size: 1.1rem;
  line-height: 1.6;
  opacity: 0.95;
  margin-bottom: 28px;
}
.demo-caption {
  max-width: 420px;
  margin-top: 14px;
  font-size: 0.9rem;
  line-height: 1.6;
  opacity: 0.95;
}
.key {
  font-weight: 600;
}
.key.arrow {
  color: #ffcdd2;
}
.key.ring {
  color: #ff8a80;
}
.key.bubble {
  display: inline-block;
  min-width: 16px;
  height: 16px;
  margin: 0 2px;
  border-radius: 8px;
  font: 700 11px/16px sans-serif;
  text-align: center;
  color: #fff;
}
.key.bubble.mine {
  background: #2e7d32;
}
.key.bubble.theirs {
  background: #c62828;
}
.features {
  background: #f5f7fa;
  color: #222;
  padding-top: 48px;
  padding-bottom: 48px;
}
.features h2,
.pricing h2 {
  font-size: 1.6rem;
  font-weight: 600;
  text-align: center;
  margin: 0 0 24px;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  max-width: 1040px;
  margin: 0 auto;
}
.feature {
  background: #fff;
}
.pricing {
  display: flex;
  justify-content: center;
  padding-top: 56px;
  padding-bottom: 24px;
}
.price-card {
  width: min(340px, 100%);
  color: #222;
}
.price {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.1;
}
.fair {
  padding-top: 16px;
  padding-bottom: 40px;
  font-size: 0.9rem;
  opacity: 0.9;
}
.about-link {
  color: #fff;
  margin-left: 6px;
}
</style>
