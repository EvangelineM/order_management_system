import { useState, useCallback, useRef, useEffect } from "react";

// Hook for using the Web Speech API
export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isBrowserSupported, setIsBrowserSupported] = useState(
    "webkitSpeechRecognition" in window || "SpeechRecognition" in window,
  );
  
  const recognitionRef = useRef(null);
  const onResultRef = useRef(null);
  const transcriptRef = useRef("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Update transcript ref whenever it changes
    transcriptRef.current = transcript;
    console.log("Transcript updated:", transcript);
  }, [transcript]);

  useEffect(() => {
    // Initialize recognition instance on mount
    console.log("useVoiceRecognition: Initializing. Browser supported:", isBrowserSupported);
    
    if (!isBrowserSupported) {
      console.warn("Speech recognition not supported");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }
    
    try {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        console.log("Recognition started");
        setIsListening(true);
        setTranscript("");
        transcriptRef.current = "";
      };

      recognition.onresult = (event) => {
        console.log("Recognition result event:", event);
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          console.log(`Result [${i}] (isFinal: ${event.results[i].isFinal}):`, transcriptText);

          if (event.results[i].isFinal) {
            final += transcriptText + " ";
          } else {
            interim += transcriptText;
          }
        }

        const result = (final || interim).trim();
        console.log("Setting transcript to:", result);
        setTranscript(result);
        transcriptRef.current = result;
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log("Recognition ended. Transcript ref value:", transcriptRef.current);
        console.log("Callback ref:", onResultRef.current);
        setIsListening(false);
        
        // Call the callback with the transcript
        if (onResultRef.current) {
          console.log("Calling result callback with:", transcriptRef.current);
          onResultRef.current(transcriptRef.current || "");
          onResultRef.current = null;
        } else {
          console.warn("No callback set when recognition ended");
        }
      };

      console.log("Recognition instance created successfully");
    } catch (error) {
      console.error("Error creating recognition instance:", error);
    }

    return () => {
      console.log("useVoiceRecognition cleanup");
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isBrowserSupported]);

  const startListening = useCallback((onResult) => {
    console.log("startListening called");
    
    if (!isBrowserSupported) {
      console.error("Voice recognition not supported");
      alert("Voice recognition is not supported in your browser");
      return;
    }

    if (!recognitionRef.current) {
      console.error("Recognition not initialized");
      return;
    }

    console.log("Setting up listening with callback:", typeof onResult);
    onResultRef.current = onResult;
    setTranscript("");
    transcriptRef.current = "";
    
    try {
      // Abort any existing recognition first
      recognitionRef.current.abort();
      console.log("Aborted previous recognition");
      
      // Wait a bit before starting
      setTimeout(() => {
        console.log("Calling recognition.start()");
        recognitionRef.current.start();
        
        // Auto-stop after 20 seconds to allow time for speech
        timeoutRef.current = setTimeout(() => {
          console.log("20-second timeout reached, stopping recognition");
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 20000);
      }, 100);
    } catch (error) {
      console.error("Error starting recognition:", error);
    }
  }, [isBrowserSupported]);

  const stopListening = useCallback(() => {
    console.log("stopListening called");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        console.log("Recognition aborted");
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    console.log("resetTranscript called");
    setTranscript("");
    transcriptRef.current = "";
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    isBrowserSupported,
  };
};
