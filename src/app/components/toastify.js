"use client";

import { toast, ToastContainer, cssTransition } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* custom animation using inline keyframes */

const FadeSlide = cssTransition({
  enter: "fadeSlideIn",
  exit: "fadeSlideOut",
  duration: [350, 350],
});

/* inject keyframes inline */
if (typeof document !== "undefined") {
  const style = document.createElement("style");

  style.innerHTML = `
  
  @keyframes fadeSlideIn {
    0% {
      opacity: 0;
      transform: translateX(40px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }

  @keyframes fadeSlideOut {
    0% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateX(40px) scale(0.90);
    }
  }

  .fadeSlideIn {
    animation: fadeSlideIn 0.35s ease forwards;
  }

  .fadeSlideOut {
    animation: fadeSlideOut 0.35s ease forwards;
  }

  `;

  document.head.appendChild(style);
}

/* base design */

const baseStyle = {
  borderRadius: "14px",
  padding: "14px 16px",
  fontSize: "14px",
  fontWeight: 500,
  backdropFilter: "blur(10px)",
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.7)",
  minWidth: "260px",
};

/* themes */

const toastStyles = {
  success: {
    icon: "🌿",
    style: {
      ...baseStyle,
      background: "linear-gradient(135deg,#ecfdf5,#d1fae5)",
      color: "#065f46",
    },
  },

  error: {
    icon: "🍓",
    style: {
      ...baseStyle,
      background: "linear-gradient(135deg,#fff1f2,#ffe4e6)",
      color: "#7f1d1d",
    },
  },

  info: {
    icon: "💎",
    style: {
      ...baseStyle,
      background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
      color: "#1e3a8a",
    },
  },

  warning: {
    icon: "🌤",
    style: {
      ...baseStyle,
      background: "linear-gradient(135deg,#fffbeb,#fde68a)",
      color: "#78350f",
    },
  },
};

/* override */

["success", "error", "info", "warning"].forEach((type) => {
  const original = toast[type];

  toast[type] = (message, options = {}) =>
    original(message, {
      icon: toastStyles[type].icon,
      style: toastStyles[type].style,
      ...options,
    });
});

/* provider */

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={2500}
      hideProgressBar
      transition={FadeSlide}   // animation applied
      closeOnClick
      pauseOnHover
      draggable
      toastStyle={{
        marginBottom: "14px",
        background: "transparent",
        boxShadow: "none",
      }}
    />
  );
}