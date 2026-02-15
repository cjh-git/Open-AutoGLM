const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        text: "智谱AI能力的移动终端设备远程控制与自动化操作前端单页应用",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        text: "项目技术文档",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      }),
      
      new Paragraph({
        text: "1 项目概述",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "1.1 项目背景", bold: true }),
          new TextRun({ text: "\n随着移动互联网的快速发展，移动终端设备在日常工作和生活中的应用越来越广泛。企业和开发者需要一种高效的方式来管理和控制多台移动设备，实现远程调试、自动化测试、批量操作等功能。同时，人工智能技术的快速发展为设备控制领域带来了新的可能性，通过AI能力可以大幅提升设备控制的智能化水平和操作效率。" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "1.2 项目定位", bold: true }),
          new TextRun({ text: "\n本项目是一款基于Vue 3技术栈开发的移动终端设备远程控制与自动化操作前端单页应用，集成智谱AI能力，实现设备管理、实时屏幕监控、AI辅助指令解析、自动化任务配置等核心功能。" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "1.3 核心特性", bold: true }),
          new TextRun({ text: "\n• 多平台设备支持：支持iOS、Android、鸿蒙OS等多种移动操作系统\n• 实时屏幕监控：实时显示设备屏幕内容\n• AI智能辅助：集成智谱AI能力，支持自然语言指令解析\n• 批量指令执行：支持批量指令下发和执行\n• 可视化操作界面：提供直观的可视化操作界面\n• 响应式设计：支持桌面端和移动端自适应" })
        ],
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: "2 技术架构",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "2.1 技术栈选型", bold: true }),
          new TextRun({ text: "\n• Vue.js 3.3.4 - 渐进式JavaScript框架\n• TypeScript 5.2.2 - JavaScript超集，提供强类型支持\n• Vite 4.4.9 - 下一代前端构建工具\n• Pinia 2.1.6 - Vue 3状态管理库\n• Lucide Vue Next 0.279.0 - 现代图标库\n• Axios 1.5.0 - HTTP客户端\n• Vue Router 4.2.4 - 路由管理器" })
        ],
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: "3 功能模块详解",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "3.1 设备管理模块", bold: true }),
          new TextRun({ text: "\n• 设备列表展示 - 显示所有已添加的移动设备\n• 设备筛选功能 - 支持按状态筛选设备\n• 设备分组管理 - 支持创建设备分组\n• 设备详情查看 - 查看设备详细信息\n• 设备添加与编辑 - 手动添加新设备" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "3.2 屏幕监控模块", bold: true }),
          new TextRun({ text: "\n• 实时屏幕显示 - 显示选中设备的实时屏幕内容\n• 屏幕控制功能 - 支持截图、全屏查看、缩放、旋转\n• 屏幕显示优化 - 渐变背景、阴影效果" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "3.3 指令控制模块", bold: true }),
          new TextRun({ text: "\n• 指令输入 - 支持直接输入ADB指令和多行指令\n• 指令执行 - 支持执行、暂停、停止操作\n• 快捷指令 - 提供常用快捷操作按钮\n• 指令历史 - 记录所有执行过的指令" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "3.4 AI集成模块", bold: true }),
          new TextRun({ text: "\n• AI指令解析 - 将自然语言指令转换为可执行指令\n• 自动化脚本生成 - 根据需求自动生成自动化脚本\n• 故障诊断 - 利用AI能力进行设备故障诊断\n• AI配置 - 管理AI相关设置" })
        ],
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: "4 页面功能说明",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "4.1 仪表盘页面（Dashboard）", bold: true }),
          new TextRun({ text: "\n• 统计卡片 - 显示设备总数、在线设备、执行指令、错误日志\n• 在线设备列表 - 展示当前在线的设备\n• 最近指令 - 显示最近执行的指令\n• 快捷操作 - 提供常用操作的快捷入口" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "4.2 设备控制页面（Device Control）", bold: true }),
          new TextRun({ text: "\n采用三栏式布局：\n• 左侧栏：设备列表和设备详情\n• 中央栏：设备屏幕显示和快捷指令\n• 右侧栏：指令输入和执行控制" })
        ],
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: "5 界面设计规范",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "5.1 色彩体系", bold: true }),
          new TextRun({ text: "\n主色调：#1E88E5（蓝色）\n辅助色：\n• 成功 #4CAF50\n• 警告 #FF9800\n• 危险 #F44336\n• 信息 #2196F3\n\n背景色：#F5F7FA\n卡片背景：#FFFFFF" })
        ],
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: "6 技术实现细节",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "6.1 状态管理", bold: true }),
          new TextRun({ text: "\n使用Pinia进行状态管理：\n• DeviceStore - 设备状态管理\n• CommandStore - 指令状态管理\n• AIStore - AI状态管理\n• LogStore - 日志状态管理\n• ConfigStore - 配置状态管理" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "6.2 路由配置", bold: true }),
          new TextRun({ text: "\n• / - 仪表盘页面\n• /control - 设备控制页面\n• /config - 参数配置页面\n• /logs - 日志管理页面" })
        ],
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: "7 部署与运行",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "环境要求：", bold: true }),
          new TextRun({ text: "\n• Node.js >= 16.0.0\n• npm >= 8.0.0" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "安装步骤：", bold: true }),
          new TextRun({ text: "\ncd device-control\nnpm install\nnpm run dev" })
        ],
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: "8 总结",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: "本项目是一款功能完善的移动终端设备远程控制与自动化操作前端单页应用，具有功能全面、技术先进、界面美观、体验优秀、易于扩展等优势。本项目可作为企业级移动设备管理工具的基础框架，根据实际需求进行二次开发和功能扩展。",
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: "文档版本：1.0",
        spacing: { before: 600 }
      }),
      new Paragraph({
        text: "创建日期：2026年2月15日"
      })
    ]
  }]
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("PROJECT_DOCUMENTATION.docx", buffer);
  console.log("Word文档已生成: PROJECT_DOCUMENTATION.docx");
});
