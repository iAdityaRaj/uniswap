import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { addToWishlist, removeFromWishlist } from "../utils/wishListApi";

export default function WishlistButton({ uid, item, initiallySaved }) {
  const [saved, setSaved] = useState(initiallySaved);

  const toggleWishlist = async () => {
    setSaved(!saved);
    try {
      if (!saved) await addToWishlist(uid, item);
      else await removeFromWishlist(uid, item.itemId || item.id);
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    }
  };

  return (
    <TouchableOpacity onPress={toggleWishlist}>
      <AntDesign
        name={saved ? "heart" : "heart"}
        size={24}
        color={saved ? "red" : "gray"}
      />
    </TouchableOpacity>
  );
}