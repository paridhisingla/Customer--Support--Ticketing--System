import { EventEmitter } from 'events';

class SupportEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Broadcast an event to all connected clients (e.g. SSE listeners)
   * @param {string} eventName - e.g. 'TICKET_CREATED', 'STATUS_UPDATED', 'SLA_ESCALATED', 'NEW_COMMENT'
   * @param {object} payload - Event data payload
   */
  broadcast(eventName, payload) {
    this.emit('ticket_event', {
      event: eventName,
      data: payload,
      timestamp: new Date().toISOString(),
    });
  }
}

export const eventBus = new SupportEventBus();
