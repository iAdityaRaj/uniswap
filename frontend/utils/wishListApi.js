const BASE_URL = "https://us-central1-uniswap-iitrpr.cloudfunctions.net";

export async function addToWishlist(uid, item) {
  const res = await fetch(`${BASE_URL}/addToWishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, item }),
  });
  return res.json();
}

export async function removeFromWishlist(uid, itemId) {
  const res = await fetch(`${BASE_URL}/removeFromWishlist`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, itemId }),
  });
  return res.json();
}

export async function getWishlist(uid) {
  const res = await fetch(`${BASE_URL}/getWishlist?uid=${uid}`);
  return res.json();
}