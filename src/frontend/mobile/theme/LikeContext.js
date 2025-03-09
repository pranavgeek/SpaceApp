// LikeContext.js
import React, { createContext, useState, useContext } from "react";

const LikeContext = createContext();

export const LikeProvider = ({ children }) => {
  const [likedProducts, setLikedProducts] = useState({});

  const toggleLike = (projectId) => {
    setLikedProducts((prevLikes) => ({
      ...prevLikes,
      [projectId]: !prevLikes[projectId],
    }));
  };

  const getLikes = (projectId) => likedProducts[projectId] || false;

  return (
    <LikeContext.Provider value={{ toggleLike, getLikes }}>
      {children}
    </LikeContext.Provider>
  );
};

export const useLikeContext = () => useContext(LikeContext);
