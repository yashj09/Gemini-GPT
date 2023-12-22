import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { IoMdSend } from "react-icons/io";

import "./App.css";

const App = () => {
  const API_KEY = "AIzaSyDWYg7pwMwierXO_Nxq19in4C7NbuvBe8o";
  const genAI = new GoogleGenerativeAI(API_KEY);

  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');

  const runGenerativeAI = useCallback(async () => {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContentStream(userInput);
      const response = await result.response;
      const generatedCode = response.text();

      let text = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        console.log(chunkText);
        text += chunkText;
      }

      const codeBlocks = generatedCode.split('```');
      const formattedBlocks = codeBlocks.map((block, index) => (
        index % 2 === 0 ? (
          <ReactMarkdown key={index}>{block}</ReactMarkdown>
        ) : (
          <div className="code-block" key={index}>
            <div className="copy-button" onClick={() => copyToClipboard(block)}>
              Copy
            </div>
            <SyntaxHighlighter language="javascript" style={a11yDark}>
              {block}
            </SyntaxHighlighter>
          </div>
        )
      ));

      setConversation(prevConversation => [
        ...prevConversation,
        { role: 'user', text: userInput },
        { role: 'gemini', text: formattedBlocks },
      ]);

      setUserInput('');
    } catch (error) {
      console.error(error);
      setConversation(prevConversation => [
        ...prevConversation,
        { role: 'error', text: 'Error: Content blocked due to safety concerns.' },
      ]);
    }
  }, [API_KEY, genAI, userInput]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && userInput.trim() !== '') {
      runGenerativeAI();
    }
  }, [runGenerativeAI, userInput]);

  const handleSend = () => {
    if (userInput.trim() !== '') {
      runGenerativeAI();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="app">
      <div className="chat-container">
        {conversation.map((message, index) => (
          <div
            key={index}
            className={message.role === 'user'
              ? 'user-message'
              : message.role === 'error'
                ? 'error-message'
                : 'gemini-message'}
          >
            {message.role === 'gemini' ? (
              message.text
            ) : (
              message.text
            )}
          </div>
        ))}
      </div>
      <div className="input-container">
        <textarea
          type="text"
          placeholder="Ask a question..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button className="send-button" onClick={handleSend}>
          <IoMdSend />
        </button>
      </div>
    </div>
  );
};

export default App;
