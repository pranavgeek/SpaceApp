import React, { createContext, useState, useContext } from "react";

const LikeContext = createContext();

export const LikeProvider = ({ children }) => {
  const [likedProducts, setLikedProducts] = useState({}); // Track likes individually by product ID

  const toggleLike = (productId) => {
    setLikedProducts((prevLikes) => ({
      ...prevLikes,
      [productId]: !prevLikes[productId], // Toggle like for the specific product
    }));
  };

  const getLikes = (productId) => {
    return likedProducts[productId] || false; // Return false if no like for product
  };

  return (
    <LikeContext.Provider value={{ toggleLike, getLikes }}>
      {children}
    </LikeContext.Provider>
  );
};

export const useLikeContext = () => useContext(LikeContext);
