import {createRequest} from 'bc-lumen/src/utils/axios'
import { WEB_API_URL } from 'Consts'

export const request = createRequest({
  baseURL: WEB_API_URL,
  onSuccess: (resp) => {
    console.log('Request successful:', resp)
  },
  onError: (error) => {
    console.error('Request failed:', error)
  }
})