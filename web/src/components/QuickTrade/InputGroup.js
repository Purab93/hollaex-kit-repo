import React from 'react';
import { oneOfType, array, string, func, number, object } from 'prop-types';
import { Select, Input } from 'antd';
import math from 'mathjs';
import { isNumeric, isFloat } from 'validator';
import {
	CaretDownOutlined,
	LoadingOutlined,
	SyncOutlined,
} from '@ant-design/icons';
import { isMobile } from 'react-device-detect';
import { DEFAULT_COIN_DATA } from 'config/constants';

import { minValue, maxValue } from 'components/Form/validations';
import { FieldError } from 'components/Form/FormFields/FieldWrapper';
import { translateError } from './utils';
import STRINGS from 'config/localizedStrings';
import { EditWrapper, Coin } from 'components';
import { getDecimals } from 'utils/utils';

const { Option } = Select;
const { Group } = Input;
// const DECIMALS = 4;

class InputGroup extends React.PureComponent {
	state = {
		isOpen: false,
	};

	onDropdownVisibleChange = (isOpen) => {
		this.setState({ isOpen });
	};

	onChangeEvent = ({ target: { value } }) => {
		this.onInputChange(value);
	};

	onInputChange = (newValue) => {
		const { onInputChange, decimal } = this.props;
		const decimalPoint = getDecimals(decimal);
		const decimalPointValue = Math.pow(10, decimalPoint);

		if (isNumeric(newValue) || isFloat(newValue)) {
			const value =
				math.floor(newValue * decimalPointValue) / decimalPointValue;
			if (isFloat(newValue) && `${newValue}`.endsWith('0')) {
				onInputChange(newValue);
			} else if (value) {
				onInputChange(value);
			} else {
				onInputChange(0);
			}
		} else {
			onInputChange(0);
		}
	};

	renderErrorMessage = (value) => {
		const {
			limits,
			forwardError,
			availableBalance,
			selectValue,
			pair,
		} = this.props;
		const keydata = pair.split('-');
		let error = '';
		if (!value || (value && !parseFloat(value))) {
			error = '';
		} else if (
			keydata[0] === selectValue &&
			limits &&
			minValue(limits.MIN)(value)
		) {
			error = minValue(limits.MIN)(value);
		} else if (
			keydata[0] === selectValue &&
			limits &&
			maxValue(limits.MAX)(value)
		) {
			error = maxValue(limits.MAX)(value);
		} else if (availableBalance) {
			error = maxValue(availableBalance)(value);
		}
		forwardError(error);
		return error;
	};

	render() {
		const { isOpen } = this.state;
		const {
			name,
			options,
			inputValue,
			selectValue,
			onSelect,
			limits = {},
			autoFocus,
			stringId,
			coins,
			loading,
			expired,
			disabled,
		} = this.props;

		const suffix = loading ? (
			<LoadingOutlined className="secondary-text ml-1" />
		) : expired ? (
			<SyncOutlined className="secondary-text ml-1" />
		) : null;

		const error = translateError(this.renderErrorMessage(inputValue));

		return (
			<div className="py-2">
				<label className="bold caps-first">
					<EditWrapper stringId={stringId}>{name}</EditWrapper>
				</label>
				<div className={isMobile ? 'w-100' : ''}>
					<Group compact className="input-group__container">
						<Select
							open={isOpen}
							size="default"
							showSearch
							filterOption={true}
							className="input-group__select"
							value={selectValue}
							style={isOpen ? { width: '100%' } : { width: '33%' }}
							onChange={onSelect}
							onDropdownVisibleChange={this.onDropdownVisibleChange}
							bordered={false}
							listItemHeight={35}
							listHeight={35 * 6}
							dropdownClassName="custom-select-style"
							suffixIcon={
								<CaretDownOutlined
									onClick={() => this.onDropdownVisibleChange(!isOpen)}
								/>
							}
						>
							{options.map((symbol, index) => {
								const { display_name, icon_id } =
									coins[symbol] || DEFAULT_COIN_DATA;
								return (
									<Option
										name="selectedPairBase"
										value={symbol}
										key={index}
										className="d-flex"
									>
										<div className="d-flex align-items-center quick-trade-select-wrapper">
											<div className="input-group__coin-icons-wrap">
												<Coin iconId={icon_id} type="CS6" />
											</div>
											<span className="pl-1">{display_name}</span>
										</div>
									</Option>
								);
							})}
						</Select>
						<Input
							type="number"
							placeholder={STRINGS['AMOUNT']}
							style={isOpen ? { display: 'none' } : { width: '67%' }}
							className="input-group__input"
							value={inputValue || ''}
							onChange={this.onChangeEvent}
							bordered={false}
							step={limits.MIN}
							min={limits.MIN}
							max={limits.MAX}
							autoFocus={autoFocus}
							suffix={suffix}
							disabled={disabled}
						/>
					</Group>
					{error && (
						<FieldError
							error={error}
							displayError={true}
							className="input-group__error-wrapper"
						/>
					)}
				</div>
			</div>
		);
	}
}

InputGroup.propTypes = {
	name: string,
	options: array,
	inputValue: oneOfType([number, string]),
	onInputChange: func,
	selectValue: string,
	onSelect: func,
	limits: object,
};

export default InputGroup;
