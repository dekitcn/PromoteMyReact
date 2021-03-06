import React from 'react';
import { Input, AutoComplete, Spin, Icon } from 'antd';
import './index.less';

const Option = AutoComplete.Option;
const isEmpty = (value) => typeof value === 'object' && Object.keys(value).length === 0;
// const DefaultOption = <Option key="empty" disabled >暂无可匹配的搜索结果</Option>;
/**
 * 作用: 函数节流
 * @params: fun         需要节流执行的程序
 * @params: delay       延迟执行时间
 * @params: time        最小触发间隔
 * @return：返回值延迟执行的函数
 */
export const throttle = (fun, delay = 800, time = 300) => {
  let timeout;
  let startTime = new Date();

  return function callback({ ...args }) {
    const curTime = new Date();
    clearTimeout(timeout);
    if (curTime - startTime >= time) {
      fun(args);
      startTime = curTime;
    } else {
      timeout = setTimeout(() => { fun(args); }, delay);
    }
  };
};
/**
 * 作用: 用户名远程搜索下拉列表选择框
 * @prop: { function }      onSelect     下拉列表选择后自定义动作
 * @prop: { function }      onChange     下拉列表选择后自定义动作，一般不使用，与handleSelect功能相似
 * @prop: { function }      format       下拉列表显示自定义规则函数，返回[{label: '',value: ''}]对象数组
 * @prop: { Promise func }  fetchData    带promise的数据获取接口
 * @prop: { string|object } value        初始值
 * @prop: { function }      valueFormat  数据显示框自定义数据显示函数。默认为 value => value
 * @prop: { object }        search       自定义搜索数据对象，不设置则采用默认itmp默认用户查询对象
 * @prop: { string }        searchKey    自定义搜索数据对象，关键词属性名，默认keyword
 */

export default class OriginSearchWithRenderProp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isShowSearch: false,
      loading: false,
      options: [],
      seachRes: [],
      value: props.value,
      search: props.search || {}
    };
    this.lastFethId = 0;
    this.load = this.load.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleOpenSearch = this.handleOpenSearch.bind(this);
    this.handleCloseSearch = this.handleCloseSearch.bind(this);
    this.lazyLoad = throttle(this.load);
  }
  // eslint-disable-next-line
  componentWillReceiveProps(nextProps) {
    const { value } = nextProps;
    if (isEmpty(value) && value !== this.props.value) {
      this.setState({ value: nextProps.value });
    }
  }
  load(params) {
    this.lastFethId += 1;
    const fetchId = this.lastFethId;
    const { fetchData } = this.props;
    // 设置loading状态，清空option
    this.setState({ loading: true, options: null });
    // 获取数据，并格式化数据
    fetchData(params).then((list) => {
      if (fetchId !== this.lastFethId) { // 异步程序，保证回调是按顺序进行
        return;
      }
      this.setState({ loading: false, seachRes: list });
    });
  }
  handleOpenSearch() {
    this.setState({ isShowSearch: true });
  }
  handleCloseSearch() {
    this.setState({ isShowSearch: false });
  }
  handleSelect(value, option) {
    const { onSelect } = this.props;
    const { seachRes } = this.state;
    // 兼容antd不同版本
    const index = option.key || option.props.index;
    // 如果定义了handleSelect， 则获取自定义值，否则获取选择的默认值
    const selectValue = onSelect ? onSelect(value, index, seachRes) : value;
    this.triggerChange(selectValue);
    this.setState({ value: selectValue });
    this.handleCloseSearch();
  }
  handleChange(value) {
    const { searchKey = 'keyword' } = this.props;
    const { search } = this.state;
    const res = { ...search };
    res[searchKey] = value;
    value && this.lazyLoad(res);
  }
  triggerChange(value) {
    const { onChange } = this.props;
    onChange && onChange(value);
  }
  render() {
    const { style, valueFormat = value => value, size = 'default', disabled = false,
      children, placeholder = '请输入' } = this.props;
    const { seachRes, isShowSearch, value, loading } = this.state;
    // 有搜索框时就禁止输入，且没有点击事件。无搜索框时就可以点击
    const inputProps = isShowSearch ? { disabled: true } : {
      onClick: this.handleOpenSearch,
    };
    return (<div
      className="originSearch"
      style={style}
      // eslint-disable-next-line
      ref={el => this.searchInputElement = el}
    >
      <Input
        // eslint-disable-next-line
        disabled={disabled}
        ref={e => this.searchInput = e}
        readOnly
        placeholder={placeholder}
        value={valueFormat(value)}
        style={{ width: '100%' }}
        size={size}
        {...inputProps}
      />
      {
        isShowSearch &&
        <div className="js-origin-search origin-search">
          <Icon type="search" className="origin-search-icon" />
          <AutoComplete
            autoFocus
            className="certain-category-search"
            dropdownClassName="certain-category-search-dropdown"
            dropdownMatchSelectWidth
            size={size}
            onBlur={this.handleCloseSearch}
            onSearch={this.handleChange}
            onSelect={this.handleSelect}
            style={{ width: '100%' }}
            optionLabelProp="value"
          >
            {loading ?
              [<Option key="loading" disabled>
                <Spin spinning={loading} style={{ paddingLeft: '45%', textAlign: 'center' }} />
              </Option>] : children(seachRes)
            }
          </AutoComplete>
        </div>
      }
    </div>);
  }
}

