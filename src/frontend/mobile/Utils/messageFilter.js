// utils/messageFilter.js

/**
 * Utility to filter messages for prohibited content
 */

// Regular expressions for detecting prohibited content
const PROHIBITED_PATTERNS = {
    // Phone numbers in various formats
    PHONE: /(\+\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}|\d{10,11}|(\d{3}[ -]?){2}\d{4}/g,
    
    // Email addresses
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    
    // URLs
    URL: /(https?:\/\/)?[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g,
    
    // Social media handles
    SOCIAL: /@[\w._]+|(\b(?:instagram|telegram|whatsapp|tiktok|facebook|snap|snapchat|fb|ig|twitter|x)\b\s*:?\s*[\w._]+)/gi,
    
    // Code words for external communication
    CODE_WORDS: /\b(?:whatsapp|telegram|signal|viber|wechat|line|dm|direct message|text me|call me|phone me|email|mail me|facebook|instagram|snap|snapchat|outside app|offline|external|off platform)\b/gi
  };
  
  // Warning message to show when content is filtered
  const WARNING_MESSAGE = "🚫 Sharing external contact info is not allowed";
  
  /**
   * Checks if a message contains prohibited content
   * @param {string} message - The message to check
   * @returns {boolean} - True if message contains prohibited content
   */
  const containsProhibitedContent = (message) => {
    if (!message || typeof message !== 'string') return false;
    
    return Object.values(PROHIBITED_PATTERNS).some(pattern => 
      pattern.test(message)
    );
  };
  
  /**
   * Filters a message by replacing prohibited content with asterisks
   * @param {string} message - The message to filter
   * @returns {string} - The filtered message
   */
  const filterMessage = (message) => {
    if (!message || typeof message !== 'string') return message;
    
    let filteredMessage = message;
    
    // Replace each match with asterisks
    Object.values(PROHIBITED_PATTERNS).forEach(pattern => {
      filteredMessage = filteredMessage.replace(pattern, match => 
        '*'.repeat(match.length)
      );
    });
    
    return filteredMessage;
  };
  
  /**
   * Process a message before sending, returns filtered message and warning flag
   * @param {string} message - The message to process
   * @returns {Object} - { filteredMessage, isFiltered, warningMessage }
   */
  const processMessage = (message) => {
    const hasProhibitedContent = containsProhibitedContent(message);
    
    return {
      filteredMessage: hasProhibitedContent ? filterMessage(message) : message,
      isFiltered: hasProhibitedContent,
      warningMessage: hasProhibitedContent ? WARNING_MESSAGE : null
    };
  };
  
  export { containsProhibitedContent, filterMessage, processMessage, WARNING_MESSAGE };