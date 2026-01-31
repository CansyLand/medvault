"use client";

import React, { useState, useRef, useEffect } from "react";
import { chatWithDocuments } from "../services/geminiService";
import type { MedicalRecord, ChatMessage } from "../types/medical";

interface ChatAssistantProps {
  records: Array<{ key: string; value: string }>;
}

export function ChatAssistant({ records }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await chatWithDocuments(
        userMessage.content,
        records,
        messages
      );

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content:
          "I apologize, but I encountered an error while processing your question. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          background: "var(--teal-deep)",
          color: "white",
          borderRadius: "50%",
          boxShadow: "0 4px 12px rgba(15, 118, 110, 0.3)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 40,
          transition: "all 0.2s ease",
        }}
        aria-label="Open chat assistant"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "96px",
            right: "24px",
            width: "384px",
            height: "500px",
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid var(--border)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "var(--mint)",
              padding: "1rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h3 style={{ fontWeight: 700, color: "var(--teal-deep)", fontSize: "1.125rem" }}>
              Ask about your documents
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "var(--teal-deep)",
                cursor: "pointer",
                padding: "4px",
              }}
              aria-label="Close chat"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "2rem" }}>
                <svg className="w-12 h-12" style={{ margin: "0 auto 1rem", opacity: 0.5 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p style={{ fontSize: "0.875rem" }}>
                  {records.length > 0
                    ? "Ask me anything about your medical records!"
                    : "Upload some documents first, then ask me questions about them!"}
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "0.75rem 1rem",
                      borderRadius: "16px",
                      fontSize: "0.875rem",
                      background: message.role === "user" ? "var(--teal-deep)" : "var(--bg-tertiary)",
                      color: message.role === "user" ? "white" : "var(--text-primary)",
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "var(--bg-tertiary)", padding: "0.75rem 1rem", borderRadius: "16px" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <div style={{ width: "8px", height: "8px", background: "var(--text-muted)", borderRadius: "50%", animation: "bounce 1s infinite" }} />
                    <div style={{ width: "8px", height: "8px", background: "var(--text-muted)", borderRadius: "50%", animation: "bounce 1s infinite", animationDelay: "0.1s" }} />
                    <div style={{ width: "8px", height: "8px", background: "var(--text-muted)", borderRadius: "50%", animation: "bounce 1s infinite", animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your documents..."
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "0.875rem",
                }}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                style={{ padding: "0.75rem 1.5rem" }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.1)",
            zIndex: -10,
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
