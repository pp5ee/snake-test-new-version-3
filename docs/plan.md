# 贪吃蛇大作战 - Implementation Plan

## Goal Description

构建一个赛博朋克风格的贪吃蛇对战游戏（贪吃蛇大作战/Snake Battle），使用React前端实现。玩家与AI蛇进行对战，支持：蛇类型选择、分数本地持久化、暂停/开始控制、吃蛇机制（吃掉比自己短的蛇，被比自己长的蛇吃掉则死亡）、动态视觉效果。

## Acceptance Criteria

- AC-1: 玩家可以选择6种不同类型的蛇
  - Positive Tests (expected to PASS):
    - 玩家能够在左侧面板选择6种蛇类型（经典青蛇、霓虹粉蛇、毒液绿蛇、熔岩红蛇、冰霜蓝蛇、黄金蛇）
    - 选中蛇类型后，游戏开始时玩家蛇使用对应配色和纹理
    - 蛇类型选择后可以更改（游戏未开始状态）
  - Negative Tests (expected to FAIL):
    - 不能选择不存在的蛇类型
    - 不能在游戏进行中更改蛇类型
- AC-2: 游戏支持开始、暂停、重新开始控制
  - Positive Tests: 点击开始按钮后游戏开始运行，按空格键或点击暂停按钮可暂停游戏，暂停后可继续或重新开始
  - Negative Tests: 游戏未开始时暂停按钮无效，游戏结束时开始按钮应重新开始而非继续
- AC-3: 分数正确保存到localStorage并在页面重新打开后显示
  - Positive Tests: 游戏结束后分数自动保存，重新打开页面可在历史记录中查看历史最高分和最近20条记录
  - Negative Tests: 页面刷新后历史记录不应丢失，分数为0时也应保存
- AC-4: 玩家可以吃掉比自己短的蛇，被比自己长的蛇吃掉则死亡
  - Positive Tests: 玩家蛇头接触比自己短的AI蛇蛇身时，AI蛇死亡，玩家获得分数；玩家蛇头接触比自己长的AI蛇时，玩家死亡
  - Negative Tests: 长度相同时应有明确的胜负规则（随机或先手优势）
- AC-5: 赛博朋克视觉风格正确呈现
  - Positive Tests: 深色背景配霓虹配色（青色 #00fff5、粉色 #ff00ff），蛇身有发光效果，食物有脉冲动画
  - Negative Tests: 不应出现普通亮色背景，不应缺少霓虹发光效果
- AC-6: 游戏运行流畅
  - Positive Tests: 在中等配置设备上保持60fps，有多条AI蛇同时移动时不卡顿
  - Negative Tests: 不应出现明显掉帧，不应出现画面撕裂

## Path Boundaries

### Upper Bound (Maximum Acceptable Scope)
实现完整的贪吃蛇大作战游戏，包含：6种蛇类型选择、完整的游戏机制（移动、吃食物、吃蛇、AI行为）、localStorage持久化、赛博朋克视觉风格、响应式布局、粒子特效和动画效果。

### Lower Bound (Minimum Acceptable Scope)
实现核心玩法：玩家控制、基础AI蛇对战、分数计算、localStorage保存基本功能，赛博朋克视觉风格的基础呈现。

### Allowed Choices
- Can use: React + Vite + Canvas API进行游戏渲染，可使用React组件处理UI层
- Cannot use: 后端服务，所有游戏逻辑在前端完成

## Feasibility Hints and Suggestions

### Conceptual Approach
1. 使用React + Vite搭建项目结构
2. 游戏画布使用Canvas 2D渲染，游戏逻辑在requestAnimationFrame循环中运行（脱离React渲染周期）
3. 使用localStorage存储分数数据，key为"snakeBattle"
4. AI蛇使用简单行为：随机移动、避墙、避自身
5. 碰撞检测使用网格系统或空间哈希优化性能

### Relevant References
- SPEC.md - 已有的详细项目规格说明书，包含完整的UI/UX和功能规格

## Dependencies and Sequence

### Milestones
1. 项目初始化: 创建React + Vite项目，安装依赖，配置开发环境
2. 基础游戏框架: 实现游戏画布、蛇的渲染、基础移动控制
3. 游戏机制完善: 吃食物、吃蛇、AI行为、死亡判定
4. 持久化和UI: localStorage集成、控制面板、分数显示、历史记录
5. 视觉增强: 赛博朋克风格、粒子特效、动画
6. 测试和优化: 性能优化、响应式测试、Bug修复

## Task Breakdown

| Task ID | Description | Target AC | Tag (`coding`/`analyze`) | Depends On |
|---------|-------------|-----------|----------------------------|------------|
| task1 | Initialize React + Vite project with dependencies | AC-1, AC-2 | coding | - |
| task2 | Create game canvas and core game loop | AC-6 | coding | task1 |
| task3 | Implement snake rendering with 6 types | AC-1, AC-5 | coding | task2 |
| task4 | Implement player controls (arrow keys/WASD) | AC-2 | coding | task2 |
| task5 | Implement AI snake behavior | AC-4 | coding | task3 |
| task6 | Implement food spawning and consumption | AC-4 | coding | task4 |
| task7 | Implement eat-snake mechanics (length comparison) | AC-4 | coding | task5 |
| task8 | Implement death conditions (wall, self-collision, eaten) | AC-4 | coding | task6 |
| task9 | Implement localStorage persistence | AC-3 | coding | task8 |
| task10 | Build control panel UI (start/pause/restart) | AC-2 | coding | task9 |
| task11 | Build score panel and history display | AC-3 | coding | task9 |
| task12 | Apply cyberpunk visual effects | AC-5 | coding | task3 |
| task13 | Add particle effects for eating food/snakes | AC-5 | coding | task12 |
| task14 | Verify and test implementation | All ACs | analyze | task13 |

## Claude-Codex Deliberation

### Agreements
- React + Canvas方案适合此类游戏，性能可满足需求
- localStorage是前端-only分数持久化的正确选择
- 赛博朋克视觉风格需要霓虹配色和发光效果

### Resolved Disagreements
- Codex假设需要后端多人对战，但实际需求是单人对战AI，Claude确认只需前端实现

### Convergence Status
- Final Status: `partially_converged` (direct mode skips convergence loop)

## Pending User Decisions

- DEC-1: 长度相同时的吃蛇胜负规则
  - Claude Position: 建议随机决定胜负，公平性更高
  - Codex Position: N/A - open question
  - Tradeoff Summary: 长度相同时可选择随机决定、先手优势、或平局继续
  - Decision Status: PENDING

## Implementation Notes

### Code Style Requirements
- Implementation code and comments must NOT contain plan-specific terminology such as "AC-", "Milestone", "Step", "Phase", or similar workflow markers
- These terms are for plan documentation only, not for the resulting codebase
- Use descriptive, domain-appropriate naming in code instead

--- Original Design Draft Start ---

# Requirement

现在我想写一个贪吃蛇的游戏，页面要高端一些，不能太简单，支持分数记录（页面本地），下一次打开还能看到自己的分数记录历史记录；需要多一些动态效果，贪吃蛇左侧可以选择蛇的类型；支持暂停，开始，支持吃其他蛇，如果比自己大就死亡，如果比自己小就获得分数；只需要前端即可，没有后端；使用react

有多条其他蛇存在，随机生成，当前长度，外观和速度以及长度，不影响，每次都保存但需要记录最高分，风格的话是赛博朋克风，需要

---

## Standard Deliverables (mandatory for every project)

- **README.md** — must be included at the project root with: project title & description, prerequisites, installation steps, usage examples with code snippets, configuration options, and project structure overview.
- **Git commits** — use conventional commit prefix `feat:` for all commits.

--- Original Design Draft End ---
