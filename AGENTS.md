<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->



# AI 行为准则

本文档用于定义 AI 在本项目中的行为和遵循的规范。

## 总则

- 我们的目标是开发稳定可靠的产品
- 所以我们要追求：
    - 代码效率
    - 架构稳定
    - 可维护可复用
- 要勇于指出我的错误，当我的要求与上面的目标冲突时，直截了当跟我沟通
- 也要积极帮我思考，找出不同方案间的优劣和 trade off，帮我重塑决策
- 不要过度防御，不要为了兜底而兜底，马奇诺防线没有意义
- 约定大于配置，代码大于文档


## 文档

### 文档原则

- 只保留必要文档
- 在你开始各种工作时，请确保你已经了解各种文档记录的内容
- 文档内容应精准、及时更新
- 重要信息要精确精简，避免冗余
- 随时清理 TODO.md 和 WIP.md
- 及时维护 README.md 保证通过阅读这个文档可以无卡点的配置，启动项目。能够快速了解项目的结构和大体逻辑

### 常规文档

- README.md - 项目描述和使用指南
- DEPLOYMENT.md - 部署指南
- DEV_NOTE.md - 开发过程中积累的需要长期关注的事情，比如框架新知识、环境配置等
  - 记录决策依据和最后决策，不需要详细记录做了什么
  - 记录本项目中积累的基建、框架知识，避免日后重复踩坑
  - 需要经常 review 此文档，作为日常知识储备

### 临时文档

- WIP.md - 开发计划、任务分解、待办事项等，主要面向中短期
- TODO.md - 长期开发计划，未来要做的事情

## 开发流程

- 拿到一个任务，先做计划，分解任务，列出 todo，写入 WIP.md
- 针对目标编写测试用例
- 逐项完成 todo，并确保测试通过
- 如有需要，记录文档以备不时之需
- 测试通过，验收完成之后，清理文档，将重要事项并入常规文档
- 涉及到项目配置的部分，需要确认 在 windows linux 下都能正常工作




## 代码规范

- 除非专门提及，否则默认使用 TypeScript，尽可能把类型写好
- 不要用 JSDoc，用 TypeScript 类型系统，不要 `any`
- 命名
  - 变量和函数使用驼峰命名法（camelCase）
  - 类和接口使用帕斯卡命名法（PascalCase）
  - 常量使用全大写加下划线（UPPER_SNAKE_CASE）
  - 文件和目录使用小写加连字符（kebab-case）
  - 避免使用缩写，除非是广泛认可的缩写
  - 函数使用动词或动宾短语命名，类使用名词命名，bool 变量使用 is/has/can 开头
- 单组件、库、脚本的长度不要超过 400 行，尽量控制在 300 行附近



## 安全

<!-- - 不要访问项目里面的 .env 文件 -->
- 如果你需要做一些操作，必须 .env，可以通过编写脚本，由我运行。比如，你要从数据库同步一些数据当作参考，就可以这么做。