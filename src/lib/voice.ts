export function createSpeechRecognizer() {
  const SR: any = (typeof window !== 'undefined') && (window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  if (!SR) return { supported: false } as const;

  const recognition = new SR();
  recognition.lang = 'ja-JP';
  recognition.interimResults = true;
  recognition.continuous = false;

  return {
    supported: true as const,
    start: () => new Promise<string>((resolve, reject) => {
      let finalText = '';
      recognition.onresult = (e: SpeechRecognitionEvent) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) finalText += res[0].transcript;
        }
      };
      recognition.onerror = (e: any) => reject(e.error || 'speech_error');
      recognition.onend = () => resolve(finalText.trim());
      recognition.start();
    }),
    stop: () => recognition.stop()
  };
}
