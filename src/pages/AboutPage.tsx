import { Link } from 'react-router-dom';
import { Page } from '../components/common';
import { DISCLAIMER_TEXT } from '../config/copy';
import { versions } from '../../engine/versions.mjs';
import { questions } from '../../engine/questions.mjs';
import { personalities } from '../../engine/personalities.mjs';
import { hiddenPersonalities } from '../../engine/hidden.mjs';

export default function AboutPage() {
  return (
    <Page>
      <p className="eyebrow">测试说明</p>
      <h1 style={{ fontSize: 24 }}>这是一份什么样的测试？</h1>

      <div className="prose" style={{ marginTop: 16 }}>
        <p>
          「麦门人格研究所」是一份<strong>娱乐向</strong>的麦当劳场景人格测试。全部 {questions.length}{' '}
          道题都发生在点餐、取餐和一起吃饭的场景里，结果会给出 {Object.keys(personalities).length}{' '}
          种主人格之一，并在满足特定条件时额外解锁 {hiddenPersonalities.length} 种隐藏人格中的一个。
        </p>

        <h3 className="section-title">怎么算出来的？</h3>
        <p>
          题目按四组二元维度计分：社交能量（热闹派 / 独享派）、选择方式（经典派 / 尝鲜派）、
          决策依据（理性派 / 感受派）、行动节奏（计划派 / 随心派）。强倾向 +3、中倾向 +2、
          弱倾向或辅助倾向 +1，取每组得分较高的一侧组成你的四字母人格。
        </p>
        <p style={{ marginTop: 8 }}>
          若某一组两侧完全同分，会依次比较该维度核心题的强倾向答案数量、更靠近题末的相关答案，
          最后用稳定哈希决胜 —— 因此<strong>同一套答案永远得到同一个结果</strong>，不会每次刷新变一个样。
        </p>

        <h3 className="section-title">“麦门契合度”是什么？</h3>
        <p>
          契合度只是把四组倾向的“干脆程度”换算成一个好看的百分比，范围固定在 74%～96%。
          它不是准确率，也不代表我们真的算准了你。
        </p>

        <h3 className="section-title">“彩蛋稀有度”是什么？</h3>
        <p>
          是隐藏人格的娱乐化标签，用于制造“我居然抽到了这个”的乐趣，
          <strong>并非真实用户获得率的统计结果</strong>，也不做任何概率承诺。隐藏人格不会随机发放：条件不满足时就是没有。
        </p>

        <h3 className="section-title">今日人格套餐</h3>
        <p>
          结果页可以把人格档案复制到已连接麦当劳 MCP 的 WorkBuddy。
          之后由 Agent 用真实门店的实时菜单组一份“今日人格套餐”：先给无券价格和选择理由，
          只有你明确同意后才会读取优惠券、创建订单。菜品、价格与库存一律以麦当劳官方渠道的实时结果为准。
        </p>

        <h3 className="section-title">你的数据在哪里？</h3>
        <p>
          答题进度、最近结果、历史记录都只写入你本机的浏览器存储（localStorage），不上传、不做账号体系，
          不采集手机号、头像、定位或设备指纹。清除浏览器数据或在首页“重新测试”即可删除。
        </p>
      </div>

      <h3 className="section-title">完整免责声明</h3>
      <p className="disclaimer">{DISCLAIMER_TEXT}</p>

      <h3 className="section-title">版本信息</h3>
      <div className="prose">
        <ul>
          <li>题库版本 testVersion：{versions.testVersion}</li>
          <li>计分版本 scoringVersion：{versions.scoringVersion}</li>
          <li>人格版本 personalityVersion：{versions.personalityVersion}</li>
        </ul>
      </div>

      <div className="btn-row" style={{ marginTop: 24 }}>
        <Link className="btn" to="/" style={{ textDecoration: 'none' }}>
          回到首页
        </Link>
        <Link className="btn btn--ghost" to="/gallery" style={{ textDecoration: 'none' }}>
          查看 16 型人格图鉴
        </Link>
      </div>
    </Page>
  );
}
