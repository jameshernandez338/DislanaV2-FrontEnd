import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, signal, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {
  ChatAssistantService,
  ChatMessageResponse
} from '@core/services/chat-assistant.service';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  time: Date;
  offerPdf?: boolean;
  pdfType?: string | null;
}

@Component({
  selector: 'app-chat-assistant',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-assistant.component.html'
})
export class ChatAssistantComponent {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  private chatService = inject(ChatAssistantService);
  private sanitizer = inject(DomSanitizer);

  isOpen = signal(false);
  isLoading = signal(false);
  isPdfLoading = signal(false);
  inputText = '';
  readonly sessionId = crypto.randomUUID();

  messages = signal<ChatMessage[]>([
    {
      role: 'bot',
      text: '¡Hola! 👋 ¿En qué podemos ayudarte hoy?',
      time: new Date()
    }
  ]);

  toggle(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.scrollToBottom();
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading()) return;

    this.messages.update(msgs => [...msgs, { role: 'user', text, time: new Date() }]);
    this.inputText = '';
    this.isLoading.set(true);
    this.scrollToBottom();

    this.chatService.sendMessage({ sessionId: this.sessionId, message: text }).subscribe({
      next: (res: ChatMessageResponse) => {
        this.messages.update(msgs => [
          ...msgs,
          {
            role: 'bot',
            text: res.message,
            time: new Date(),
            offerPdf: res.offerPdf,
            pdfType: res.pdfType
          }
        ]);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.messages.update(msgs => [
          ...msgs,
          {
            role: 'bot',
            text: 'Ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.',
            time: new Date()
          }
        ]);
        this.isLoading.set(false);
        this.scrollToBottom();
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  requestPdf(pdfType: string): void {
    if (this.isPdfLoading()) return;
    this.isPdfLoading.set(true);

    this.chatService.generatePdf({ tipo: pdfType, sessionId: this.sessionId }).subscribe({
      next: (blob: Blob) => {
        this.isPdfLoading.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${pdfType}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: async (err) => {
        this.isPdfLoading.set(false);
        let errorMessage = 'Error al generar el PDF. Intenta de nuevo.';
        try {
          const text = await (err.error as Blob).text();
          const body = JSON.parse(text);
          if (body?.message) errorMessage = body.message;
        } catch {}
        this.messages.update(msgs => [
          ...msgs,
          { role: 'bot', text: errorMessage, time: new Date() }
        ]);
        this.scrollToBottom();
      }
    });
  }

  parseMarkdown(text: string): SafeHtml {
    let html = text
      // Escape HTML entities first
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Links: [label](url)
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline font-medium text-blue-600 hover:text-blue-800">$1</a>'
      )
      // Bold: **text**
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
