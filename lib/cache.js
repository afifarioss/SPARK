const liveSparks = [];
const MAX_SPARKS = 500;

export function getLiveSparks() {
  return liveSparks;
}

export function addSpark(spark) {
  liveSparks.unshift(spark);
  if (liveSparks.length > MAX_SPARKS) {
    liveSparks.pop();
  }
}

export function boostSpark(castHash) {
  const spark = liveSparks.find((s) => s.castHash === castHash);
  if (spark) {
    spark.totalScore = Math.round(spark.totalScore * 1.1);
    spark.boosted = true;
    console.log(`⚡ Boosted spark ${spark.sparkId} (+10%)`);
  }
}
