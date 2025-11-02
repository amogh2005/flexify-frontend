// import React, { useState, useRef, useEffect } from 'react';

// const ChatBot = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     {
//       text: "Hi! I'm the Flexify Assistant. How can I help you today?",
//       sender: 'bot'
//     }
//   ]);
//   const [inputValue, setInputValue] = useState('');
//   const messagesEndRef = useRef(null);

//   // FAQ database
//   const faqDatabase = {
//     'hello': 'Hello! How can I help you with Flexify today?',
//     'hi': 'Hi there! What would you like to know about Flexify?',
//     'login': 'To login, click the "Login" button in the navbar, then choose your role: User, Provider, or Admin. Enter your email and password to access your account.',
//     'how to login': 'To login, click the "Login" button in the navbar, then choose your role: User, Provider, or Admin. Enter your email and password to access your account.',
//     'how do i login': 'To login, click the "Login" button in the navbar, then choose your role: User, Provider, or Admin. Enter your email and password to access your account.',
//     'sign in': 'Click "Login" in the navbar and select your account type (User, Provider, or Admin). Enter your credentials to sign in.',
//     'log in': 'Click "Login" in the navbar and select your account type (User, Provider, or Admin). Enter your credentials to sign in.',
//     'sign up': 'You can sign up as a user or provider. Click on "Sign Up" in the navbar or use the buttons on the home page.',
//     'register': 'You can sign up as a user or provider. Click on "Sign Up" in the navbar or use the buttons on the home page.',
//     'provider': 'Providers can sign up to offer their services on Flexify. Click "Become a Provider" to register. After signing up, you can login with your credentials.',
//     'user': 'Users can browse and book services from verified providers. Click "Sign Up as User" to get started. Then login with your credentials.',
//     'admin': 'Admin login is available at /login/admin. Only authorized administrators can access this panel.',
//     'book': 'You can book a service by clicking "Book Now" or "Browse Services" to find available providers.',
//     'booking': 'You can book a service by clicking "Book Now" or "Browse Services" to find available providers.',
//     'service': 'Flexify offers various services like cleaners, electricians, plumbers, and more. Click "Browse Services" to see all available categories.',
//     'payment': 'Flexify uses secure payment systems including Razorpay and Stripe. All transactions are encrypted and safe.',
//     'verified': 'All providers on Flexify are verified and background-checked for your safety and peace of mind.',
//     'contact': 'You can reach us at:\nPhone: +91 7676838995\nEmail: nithinnmallikarjuna@gmail.com',
//     'support': 'For support, call us at +91 7676838995 or email nithinnmallikarjuna@gmail.com',
//     'help': 'I can help you with signing up, logging in, booking services, understanding Flexify features, and more! What would you like to know?',
//     'forgot password': 'Click on "Forgot Password?" on the login page and enter your email to receive a password reset link via email.',
//     'reset password': 'Click on "Forgot Password?" on the login page and enter your email to receive a password reset link via email.',
//     'password': 'If you forgot your password, click "Forgot Password?" on the login page. You\'ll receive an email with reset instructions.',
//     'default': "I'm here to help with Flexify! Ask me about logging in, signing up, booking services, or anything else."
//   };

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const getResponse = (userMessage) => {
//     const lowerMessage = userMessage.toLowerCase();
    
//     // Check for matching keywords
//     for (const [key, response] of Object.entries(faqDatabase)) {
//       if (lowerMessage.includes(key)) {
//         return response;
//       }
//     }
    
//     return faqDatabase.default;
//   };

//   const handleSend = () => {
//     if (inputValue.trim()) {
//       const userMessage = inputValue.trim();
//       setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
//       setInputValue('');
      
//       // Simulate bot response
//       setTimeout(() => {
//         const botResponse = getResponse(userMessage);
//         setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
//       }, 500);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSend();
//     }
//   };

//   const handleToggle = () => {
//     setIsOpen(!isOpen);
//   };

//   return (
//     <>
//       {/* Chat Button */}
//       <button 
//         className="chatbot-toggle" 
//         onClick={handleToggle}
//         aria-label="Toggle chat"
//       >
//         {isOpen ? '✕' : '💬'}
//       </button>

//       {/* Chat Window */}
//       {isOpen && (
//         <div className="chatbot-container">
//           <div className="chatbot-header">
//             <div className="chatbot-title">
//               <span className="chatbot-icon">🤖</span>
//               <h3>Flexify Assistant</h3>
//             </div>
//             <button 
//               className="chatbot-close" 
//               onClick={handleToggle}
//               aria-label="Close chat"
//             >
//               ✕
//             </button>
//           </div>
          
//           <div className="chatbot-messages">
//             {messages.map((msg, index) => (
//               <div key={index} className={`chatbot-message ${msg.sender}-message`}>
//                 <p>{msg.text}</p>
//               </div>
//             ))}
//             <div ref={messagesEndRef} />
//           </div>
          
//           <div className="chatbot-input-container">
//             <input
//               type="text"
//               className="chatbot-input"
//               value={inputValue}
//               onChange={(e) => setInputValue(e.target.value)}
//               onKeyPress={handleKeyPress}
//               placeholder="Ask me anything..."
//             />
//             <button 
//               className="chatbot-send" 
//               onClick={handleSend}
//               aria-label="Send message"
//             >
//               ➤
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default ChatBot;
import React, { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false); // 👈 new: for small popup hint
  const [messages, setMessages] = useState([
    {
      text: "Hi! I'm the Flexify Assistant. How can I help you today?",
      sender: 'bot'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // 👇 Show horizontal pop-up for a few seconds after load
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 1000); // show after 1s
    const hideTimer = setTimeout(() => setShowHint(false), 6000); // hide after 6s
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  const faqDatabase = [
    {
      keywords: ['hello', 'hi', 'hey', 'hey there'],
      response: 'Hello! How can I help you with Flexify today?'
    },
    {
      keywords: ['login as user', 'login as provider', 'sign in as user', 'sign in as provider', 'how to login', 'how do i login', 'log in'],
      response: 'To login, hover over "User" or "Provider" in the navbar and click on "Login". Then enter your email and password to access your account.'
    },
    {
      keywords: ['sign up as user', 'sign up as provider', 'register as user', 'register as provider', 'new user', 'create account'],
      response: 'To register, hover over "User" or "Provider" in the navbar and click on "Sign Up". Then enter all the required details to create your account.'
    },
    {
      keywords: ['provider', 'become a provider'],
      response: 'Providers can sign up to offer their services on Flexify. Click "Become a Provider" to register. After signing up, you can login with your credentials.'
    },
    {
      keywords: ['user', 'users'],
      response: 'Users can browse and book services from verified providers. Click "Sign Up as User" to get started. Then login with your credentials.'
    },
    {
      keywords: ['admin login', 'how admin login works', 'login as admin', 'admin panel', 'admin access'],
      response: 'Admin login is available at /login/admin. Only authorized administrators can access this panel.'
    },
    {
      keywords: ['book', 'booking', 'how to book', 'reserve service'],
      response: 'You can book a service by clicking "Book Now" or "Browse Services" to find available providers.'
    },
    {
      keywords: ['service', 'services', 'available services'],
      response: 'Flexify offers various services like cleaners, electricians, plumbers, and more. Click "Browse Services" to see all available categories.'
    },
    {
      keywords: ['payment', 'pay', 'payment options', 'how to pay'],
      response: 'Flexify uses secure payment systems including Razorpay and Stripe. All transactions are encrypted and safe.'
    },
    {
      keywords: ['verified', 'safety', 'background check'],
      response: 'All providers on Flexify are verified and background-checked for your safety and peace of mind.'
    },
    {
      keywords: ['contact', 'reach', 'email', 'phone', 'contact us'],
      response: 'You can reach us at:\nPhone: +91 7676838995\nEmail: nithinnmallikarjuna@gmail.com'
    },
    {
      keywords: ['support', 'help', 'assistance', 'question'],
      response: 'I can help you with signing up, logging in, booking services, understanding Flexify features, and more! What would you like to know?'
    },
    {
      keywords: ['forgot password', 'reset password', 'password'],
      response: 'Click on "Forgot Password?" on the login page and enter your email to receive a password reset link via email.'
    },
    {
      keywords: ['default'],
      response: "I'm here to help with Flexify! Ask me about logging in, signing up, booking services, or anything else."
    }
  ];
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
  
    for (const item of faqDatabase) {
      for (const keyword of item.keywords) {
        if (lowerMessage.includes(keyword)) {
          return item.response;
        }
      }
    }
  
    return faqDatabase.find(item => item.keywords.includes('default')).response;
  };
  

  const handleSend = () => {
    if (inputValue.trim()) {
      const userMessage = inputValue.trim();
      setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
      setInputValue('');
      setTimeout(() => {
        const botResponse = getResponse(userMessage);
        setMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
      }, 500);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setShowHint(false); // hide the hint when opened
  };

  return (
    <>
      {/* 💬 Floating Chat Button */}
      <button className="chatbot-toggle" onClick={handleToggle} aria-label="Toggle chat">
        {isOpen ? '✕' : '💬'}
      </button>

      {/* 👇 Small horizontal “Ask me anything” popup */}
      {!isOpen && showHint && (
        <div
          className="chatbot-hint"
          onClick={handleToggle}
        >
          💬 Ask me anything...
        </div>
      )}

      {/* 💬 Full Chat Window */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <span className="chatbot-icon">🤖</span>
              <h3>Flexify Assistant</h3>
            </div>
            <button className="chatbot-close" onClick={handleToggle} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`chatbot-message ${msg.sender}-message`}>
                <p>{msg.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-container">
            <input
              type="text"
              className="chatbot-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
            />
            <button className="chatbot-send" onClick={handleSend} aria-label="Send message">
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;

