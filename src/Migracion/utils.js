function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function getIdsUpTo(max) {
  const ids = [1];
  for (let i = 2; i <= max; i++) {
    if (isPrime(i)) {
      ids.push(i);
    }
  }
  return ids;
}

export { isPrime, getIdsUpTo };
