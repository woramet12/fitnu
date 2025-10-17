// components/FormControls.js
// คอมโพเนนต์ฟอร์มที่ปรับคอนทราสต์สำหรับ Light/Dark mode ให้เรียบร้อย

export const fieldClass =
  "w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 " +
  "focus:ring-green-400 transition " +
  // Light mode
  "bg-white text-gray-900 placeholder-gray-400 border-gray-300 " +
  // Dark mode
  "dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-700";

export const labelClass = "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200";

export const cardClass =
  "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 " +
  "rounded-2xl shadow-lg";

export const headingClass = "text-3xl md:text-4xl font-extrabold text-green-700 dark:text-green-400";

export function Label({ children, className = "", ...props }) {
  return (
    <label className={`${labelClass} ${className}`} {...props}>
      {children}
    </label>
  );
}

export function TextInput({ className = "", ...props }) {
  return <input className={`${fieldClass} ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }) {
  return <textarea className={`${fieldClass} ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`${fieldClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function PrimaryButton({ className = "", children, ...props }) {
  return (
    <button
      className={
        "w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg " +
        "focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-60 " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className = "", children, ...props }) {
  return (
    <div className={`${cardClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
