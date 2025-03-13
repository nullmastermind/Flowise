// assets
import {
  IconTrash,
  IconFileUpload,
  IconFileExport,
  IconCopy,
  IconMessage,
  IconDatabaseExport,
  IconAdjustmentsHorizontal,
  IconUsers,
  IconTemplate
} from '@tabler/icons-react'

// constant
const icons = {
  IconTrash,
  IconFileUpload,
  IconFileExport,
  IconCopy,
  IconMessage,
  IconDatabaseExport,
  IconAdjustmentsHorizontal,
  IconUsers,
  IconTemplate
}

// ==============================|| SETTINGS MENU ITEMS ||============================== //

const settings = {
  id: 'settings',
  title: '',
  type: 'group',
  children: [
    {
      id: 'viewMessages',
      title: 'Xem Messages',
      type: 'item',
      url: '',
      icon: icons.IconMessage
    },
    {
      id: 'viewLeads',
      title: 'Xem Leads',
      type: 'item',
      url: '',
      icon: icons.IconUsers
    },
    {
      id: 'viewUpsertHistory',
      title: 'Lịch sử cập nhật',
      type: 'item',
      url: '',
      icon: icons.IconDatabaseExport
    },
    {
      id: 'chatflowConfiguration',
      title: 'Cấu hình',
      type: 'item',
      url: '',
      icon: icons.IconAdjustmentsHorizontal
    },
    {
      id: 'saveAsTemplate',
      title: 'Lưu thành mẫu',
      type: 'item',
      url: '',
      icon: icons.IconTemplate
    },
    {
      id: 'duplicateChatflow',
      title: 'Nhân bản Chatflow',
      type: 'item',
      url: '',
      icon: icons.IconCopy
    },
    {
      id: 'loadChatflow',
      title: 'Nạp Chatflow',
      type: 'item',
      url: '',
      icon: icons.IconFileUpload
    },
    {
      id: 'exportChatflow',
      title: 'Xuất Chatflow',
      type: 'item',
      url: '',
      icon: icons.IconFileExport
    },
    {
      id: 'deleteChatflow',
      title: 'Xoá Chatflow',
      type: 'item',
      url: '',
      icon: icons.IconTrash
    }
  ]
}

export default settings
