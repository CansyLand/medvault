import { DataRequest, RequestedDataItem } from '../types'

export interface ApprovalWebhookData {
  requestId: string
  requester: string
  purpose: string
  approvedItems: RequestedDataItem[]
  approvalType: 'selected' | 'all'
  timestamp: string
  transferNote: string
  // Add any additional metadata you want to send
  format?: string
  validity?: string
  retention?: string
}

export const sendApprovalWebhook = async (data: ApprovalWebhookData): Promise<void> => {
  try {
    const response = await fetch('https://cansy.app.n8n.cloud/webhook-test/medical-data-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        transferNote: 'Transfer data from GER to USA',
      }),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`)
    }

    console.log('✅ Approval webhook sent successfully')
  } catch (error) {
    console.error('❌ Failed to send approval webhook:', error)
    // You might want to show a user notification here
    throw error
  }
}