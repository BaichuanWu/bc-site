# wqb alpha workflow

## 简介

我想搭建一个 workflow的前端，bc-agent 有dsl 串联起一些 agent,前一个 agent的输出是后一个agent的输入， 每个agent自身管理自己的conversation, verify自己的output, 之前没有前端，是默认全自动自行流转的，现在是需要一个前端界面管理worfklow, 不是自动流转，前端可以进入到每个agent的conversation, 查看目前agent的进度，并且手动录入补充信息，设置这个agent此次是否自动流转，不自动流转的话只能手动点击，让其流转。
这个页面能看到 此次workflow 的整体进度，也可以点进每个agent看具体的执行，可以手动点击运行workflow的实例，设置此次运行的llm 的 agent的配置model等等，在每个conversation内部也可以手动置顶model等切换model,
注意，很多功能是通用的，目的是为了可以让我深度参与到workflow的探索中。

目前只需要根据alpha 探索的workflow 搭建进行思考，整体的架构肯定是和具体业务无关的。workflow其实是支持分支的，不仅是dsl的设定上就支持，比如什么情况下fastexpr alpha, 什么情况下 python alpha, 同时我可以重跑已经执行完毕的agent, 重新运行，后续的步骤也会重新流转。

后端肯定是用backgroundtask 来运行的，只是这套流程是在bc-agent中设定么。我的想法比较粗糙，深度思考如何构建这个 web工作流