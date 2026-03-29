# Email Guardrails — RepWell

## Stack
- React Email for templates
- Resend for delivery

## Rules
- Use React Email components, not raw HTML
- Test email rendering across clients (Gmail, Outlook, Apple Mail)
- Follow CAN-SPAM compliance (unsubscribe links, physical address)
- SPF/DKIM/DMARC must be configured for sending domains
- Implement proper email validation before sending
- Handle bounce and complaint webhooks
