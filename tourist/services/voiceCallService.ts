import { EventEmitter } from 'events';

class VoiceCallService extends EventEmitter {
  private isCallActive: boolean = false;

  async startCall() {
    if (this.isCallActive) {
      console.log('Call is already active');
      return;
    }

    try {
      this.isCallActive = true;
      this.emit('callStatus', 'connected');
    } catch (error) {
      console.error('Error starting call:', error);
      this.emit('error', error);
      this.emit('callStatus', 'error');
      await this.endCall();
    }
  }

  async endCall() {
    this.isCallActive = false;
    this.emit('callStatus', 'idle');
  }

  sendTextMessage(text: string) {
    if (this.isCallActive) {
      this.emit('message', {
        type: 'transcript',
        content: text
      });
    }
  }
}

export const callService = new VoiceCallService(); 