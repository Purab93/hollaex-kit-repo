import React, { Fragment, useEffect, useState } from 'react';
import { ReactSVG } from 'react-svg';
import { Button, Form, Input, message, Modal, Select } from 'antd';
import { Link } from 'react-router';
import {
	ExclamationCircleFilled,
	CaretUpFilled,
	CaretDownFilled,
	UserOutlined,
} from '@ant-design/icons';
import { SubmissionError } from 'redux-form';
import classnames from 'classnames';

import Notes from './Notes';
import UserData from './UserData';
import { AdminHocForm } from '../../../components';
import Audits from '../Audits';
import Logins from '../Logins';
import Verification from '../Verification';
import DataDisplay, { renderRowInformation } from '../Verification/DataDisplay';
import {
	performVerificationLevelUpdate,
	updateDiscount,
	deleteNotes,
} from './actions';
import {
	validateRequired,
	validateRange,
	validateDiscount,
} from '../../../components/AdminForm/validations';
import { STATIC_ICONS } from 'config/icons';
import Image from 'components/Image';
import withConfig from 'components/ConfigProvider/withConfig';

const VerificationForm = AdminHocForm('VERIFICATION_FORM');

const RenderModalContent = ({
	modalKey = '',
	userData,
	constants,
	onChangeSuccess,
	handleClose,
	refreshData,
	allIcons,
	userTiers,
	handleApply,
	handleDiscount,
}) => {
	const [discount, setDiscount] = useState(userData.discount);

	const onSubmit = (refreshData) => (values) => {
		// redux form set numbers as string, se we have to parse them
		const postValues = {
			user_id: userData.id,
			verification_level: parseInt(values.verification_level, 10),
		};
		return performVerificationLevelUpdate(postValues)
			.then(() => {
				refreshData(postValues);
				handleClose();
			})
			.catch((err) => {
				let error = err && err.data ? err.data.message : err.message;
				throw new SubmissionError({ _error: error });
			});
	};
	const renderLevelOptions = (levels) =>
		levels.map((level, index) => (
			<Select.Option key={index} value={level}>
				<div className="asset-list">
					<Image
						icon={allIcons['dark'][`LEVEL_ACCOUNT_ICON_${level}`]}
						wrapperClassName="select-level-icon"
					/>
					<div className="select-coin-text">{`Account tier ${level}`}</div>
				</div>
			</Select.Option>
		));

	const handleApplyConfirm = (user, discount) => {
		const body = {
			discount,
		};
		return updateDiscount(user, body)
			.then((data) => {
				handleDiscount(true);
				handleClose();
				message.success('Discount added successfully');
			})
			.catch((err) => {
				const errMsg = err.data ? err.data.message : err.message;
				message.error(errMsg);
			});
	};

	const submitValues = ({ feeDiscount }) => {
		setDiscount(parseFloat(feeDiscount));
		handleApply('fee-discount-confirm');
	};

	switch (modalKey) {
		case 'notes':
			return (
				<Notes
					initialValues={{
						id: userData.id,
						note: userData.note,
					}}
					userInfo={userData}
					onChangeSuccess={onChangeSuccess}
					handleClose={handleClose}
				/>
			);
		case 'users':
			return (
				<div className="user-data-form">
					<div className="d-flex align-items-center mb-3">
						<div>
							<ReactSVG
								src={STATIC_ICONS.USER_DETAILS_ICON}
								className="user-edit-icon"
							/>
						</div>
						<h3>{`Edit user ${userData.id} data`}</h3>
					</div>
					<UserData
						initialValues={userData}
						onChangeSuccess={onChangeSuccess}
						handleClose={handleClose}
					/>
				</div>
			);
		case 'verification-levels':
			return (
				<div className="user-data-form">
					<h3>User level</h3>
					<VerificationForm
						onSubmit={onSubmit(refreshData)}
						buttonText="Update"
						buttonClass="green-btn"
						initialValues={{
							verification_level: userData.verification_level,
						}}
						fields={{
							verification_level: {
								type: 'select',
								renderOptions: renderLevelOptions,
								options: Object.keys(userTiers),
								label: 'Adjust user level',
								validate: [
									validateRequired,
									validateRange(
										Object.keys(userTiers).map((value) => `${value}`)
									),
								],
							},
						}}
					/>
				</div>
			);
		case 'fee-discount':
			return (
				<div className="user-discount-wrapper">
					<Form
						name="user-discount-form"
						initialValues={{ feeDiscount: discount }}
						onFinish={submitValues}
					>
						<div className="title">Trading fee discount</div>
						<div>
							Reduce this users trading fees by applying inputting the specific
							discount below. Note, the reduction is applied on top of the
							current user trading fee level.
						</div>
						<div className="mt-4 mb-3">
							<div>Fee discount</div>
							<Form.Item
								name="feeDiscount"
								rules={[
									{ required: true, message: 'Please input your Fee discount' },
									{ validator: validateDiscount },
								]}
							>
								<Input type="number" suffix="%" />
							</Form.Item>
						</div>
						<div>
							When applying a fee reduction an email notification will be sent
							to the user.
						</div>
						<div>
							<Button
								type="primary"
								className="green-btn w-100 mt-4"
								htmlType="submit"
							>
								Next
							</Button>
						</div>
					</Form>
				</div>
			);
		case 'fee-discount-confirm':
			return (
				<div className="user-discount-wrapper">
					<div className="title">Check and confirm</div>
					<div>Please check that the details below are correct.</div>
					<div className="box-content">
						<div>
							<b>Current user level:</b> {userData.verification_level}
						</div>
						<div className="mt-2">
							<b>Fee discount:</b> {discount}
						</div>
					</div>
					<div>
						When applying a fee reduction an email notification will be sent to
						the user.
					</div>
					<div className="button-wrapper">
						<Button
							type="primary"
							className="green-btn"
							onClick={() => handleApply('fee-discount')}
						>
							Back
						</Button>
						<Button
							type="primary"
							className="green-btn"
							onClick={() => handleApplyConfirm(userData, discount)}
						>
							Apply
						</Button>
					</div>
				</div>
			);
		default:
			return <div></div>;
	}
};

const AboutData = ({
	userData = {},
	userImages = {},
	constants = {},
	refreshData,
	disableOTP,
	flagUser,
	freezeAccount,
	verifyEmail,
	recoverUser,
	onChangeSuccess,
	allIcons = {},
	userTiers,
	kycPluginName,
	requestUserData,
}) => {
	const [isUpload, setUpload] = useState(false);
	const [isEdit, setEdit] = useState(false);
	const [showRemaining, setShow] = useState(false);
	const [modalKey, setModalKey] = useState('');
	const [isApply, setApply] = useState(false);
	const [isDiscount, setDiscountApply] = useState(false);
	useEffect(() => {
		if (userData.discount) {
			setDiscountApply(true);
		} else {
			setDiscountApply(false);
		}
	}, [userData]);
	const handleNotesRemove = () => {
		Modal.confirm({
			icon: <ExclamationCircleFilled />,
			content: <div>Are you sure want to delete this?</div>,
			onOk: () => {
				return deleteNotes(userData.id)
					.then(() => {
						onChangeSuccess({
							...userData,
							note: '',
						});
						handleClose();
					})
					.catch((err) => {
						throw new SubmissionError({ _error: err.data.message });
					});
			},
		});
	};
	const handleOpenModal = (key = '') => {
		setEdit(true);
		setModalKey(key);
	};
	const handleClose = () => {
		setEdit(false);
		setModalKey('');
		setApply(false);
	};

	const handleApply = (key, isApply = false) => {
		if (isApply) {
			setModalKey(key);
			setApply(true);
		} else {
			setModalKey(key);
		}
	};

	const handleDiscount = (value) => {
		if (value) {
			setDiscountApply(value);
		}
	};
	const {
		email,
		full_name,
		gender,
		nationality,
		dob,
		phone_number,
		address = {},
		...rest
	} = userData;
	const userInfo = {
		email,
		full_name,
		gender: gender ? 'Woman' : 'Man',
		nationality,
		dob,
		phone_number,
		country: address.country,
		address: address.address,
		postal_code: address.postal_code,
		city: address.city,
	};

	const renderIcons = () => {
		if (userData.is_admin) {
			return (
				<img
					src={STATIC_ICONS.BLUE_SCREEN_EYE_ICON}
					className="user-info-icon"
					alt="EyeIcon"
				/>
			);
		} else if (userData.is_communicator) {
			return (
				<ReactSVG
					src={STATIC_ICONS.BLUE_SCREEN_COMMUNICATON_SUPPORT_ROLE}
					className="user-info-icon"
				/>
			);
		} else if (userData.is_kyc) {
			return (
				<ReactSVG
					src={STATIC_ICONS.BLUE_SCREEN_KYC}
					className="user-info-icon"
				/>
			);
		} else if (userData.is_supervisor) {
			return (
				<ReactSVG
					src={STATIC_ICONS.BLUE_SCREEN_SUPERVISOR}
					className="user-info-icon"
				/>
			);
		} else if (userData.is_support) {
			return (
				<ReactSVG
					src={STATIC_ICONS.BLUE_SCREEN_EXCHANGE_SUPPORT_ROLE}
					className="user-info-icon"
				/>
			);
		} else {
			return <UserOutlined className="user-icon" />;
		}
	};

	const renderRole = () => {
		if (userData.is_admin) {
			return 'admin';
		} else if (userData.is_communicator) {
			return 'communicator';
		} else if (userData.is_kyc) {
			return 'kyc';
		} else if (userData.is_supervisor) {
			return 'supervisor';
		} else if (userData.is_support) {
			return 'support';
		} else {
			return 'user';
		}
	};

	return (
		<div>
			<div className="d-flex justify-content-end header-section mb-5">
				<div className="d-flex align-items-center my-5">
					<div className="about-info d-flex align-items-center justify-content-center">
						{userData.activated ? (
							<Fragment>
								<div className="about-info-content">
									<div>Account is active</div>
								</div>
								<ReactSVG
									src={STATIC_ICONS.VERIFICATION_ICON}
									className={'verification-icon'}
									style={{
										position: 'relative',
										top: 2,
										left: 5,
									}}
								/>
							</Fragment>
						) : (
							<Fragment>
								<div>
									<div>Recover account</div>
									<div
										className="info-link"
										onClick={() => {
											recoverUser();
										}}
									>
										Recover
									</div>
								</div>
								<div>
									<svg
										style={{
											position: 'relative',
											top: 2,
											marginLeft: 15,
											transform: 'rotate(40deg)',
										}}
										fill="#fff"
										height="40px"
										width="40px"
										viewBox="0 0 512.001 512.001"
									>
										<g>
											<path d="M256.001,0C142.514,0,50.186,92.328,50.186,205.814c0,1.456,0.348,2.892,1.014,4.186l0.798,1.551    c0.154,0.3,0.325,0.591,0.511,0.871l195.784,295.246c1.009,1.62,2.487,2.87,4.227,3.598c0.121,0.051,0.239,0.105,0.362,0.15    c0.233,0.085,0.469,0.16,0.708,0.227c0.195,0.055,0.393,0.101,0.593,0.143c0.201,0.042,0.4,0.085,0.605,0.115    c0.369,0.052,0.743,0.082,1.12,0.089c0.045,0,0.088,0.011,0.132,0.011c0.005,0,0.011-0.001,0.016-0.001    c0.006,0,0.013,0.001,0.02,0.001c0.001,0,0.002,0,0.004,0c0.454,0,0.9-0.044,1.342-0.11c0.071-0.011,0.14-0.027,0.211-0.04    c0.395-0.068,0.782-0.162,1.162-0.281c0.051-0.016,0.102-0.032,0.154-0.049c1.922-0.637,3.612-1.888,4.758-3.621l196.589-297.036    c0.992-1.498,1.52-3.254,1.52-5.05C461.815,92.328,369.487,0,256.001,0z M223.634,31.592c7.533-6.373,15.31-10.463,23.214-12.248    v167.661c-11.956-7.188-25.667-11.035-40.013-11.036c-14.159,0-27.701,3.751-39.547,10.758    c2.145-43.896,11.669-84.492,27.365-115.884C203.126,53.897,212.877,40.692,223.634,31.592z M203.086,25.917    c-9.085,9.706-17.437,22.011-24.802,36.742c-16.977,33.953-27.201,77.647-29.339,124.599    c-12.055-7.354-25.924-11.289-40.442-11.289c-13.945,0-27.288,3.643-39.004,10.448C77.388,109.991,131.362,47.049,203.086,25.917z     M71.159,207.431c10.547-8.521,23.563-13.16,37.344-13.16c15.119,0,29.327,5.569,40.352,15.74l-0.804,0.27l77.087,229.355    L71.159,207.431z M246.85,446.784l-79.761-237.309c10.939-9.825,24.899-15.204,39.746-15.204c14.966,0,29.037,5.464,40.014,15.442    V446.784z M265.15,19.344c7.905,1.785,15.682,5.875,23.216,12.248c10.757,9.1,20.508,22.305,28.981,39.251    c15.696,31.393,25.225,71.99,27.369,115.886c-11.845-7.008-25.389-10.759-39.55-10.76c-14.346,0-28.06,3.848-40.016,11.036V19.344    z M265.15,209.714c10.978-9.978,25.047-15.442,40.016-15.442c14.847,0,28.809,5.381,39.747,15.205L265.15,446.974V209.714z     M286.903,439.69l77.046-229.408l-0.804-0.27c11.025-10.172,25.234-15.74,40.352-15.74c13.718,0,26.678,4.597,37.201,13.044    L286.903,439.69z M403.497,175.969c-14.516,0-28.387,3.935-40.442,11.289c-2.138-46.952-12.362-90.647-29.339-124.599    c-7.366-14.733-15.721-27.036-24.809-36.743c71.728,21.13,125.705,84.075,133.596,160.502    C430.786,179.612,417.442,175.969,403.497,175.969z" />
										</g>
									</svg>
								</div>
							</Fragment>
						)}
					</div>
					<div className="about-info d-flex align-items-center justify-content-center">
						<Fragment>
							<div className="about-info-content">
								<div className="info-txt">Trading Fee discount</div>
								<div
									className="info-link"
									onClick={() => handleApply('fee-discount', true)}
								>
									{isDiscount ? 'Adjust' : 'Apply'}
								</div>
							</div>
							<div
								className={classnames('percentage-txt ml-2', {
									'percentage-txt-active': isDiscount,
								})}
							>
								%
							</div>
							{isDiscount ? (
								<div className={'about-icon-active'}>
									<ReactSVG
										src={STATIC_ICONS.VERIFICATION_ICON}
										className={'verification-icon'}
									/>
								</div>
							) : null}
						</Fragment>
					</div>
					<div className="about-info d-flex align-items-center justify-content-center">
						{userData.email_verified ? (
							<Fragment>
								<div className="about-info-content">
									<div>Email verification</div>
									<div>Verified</div>
								</div>
								<div className={'about-icon-active'}>
									<ReactSVG
										src={STATIC_ICONS.USER_EMAIL_VERIFIED}
										className={'about-icon'}
									/>
								</div>
							</Fragment>
						) : (
							<Fragment>
								<div>
									<div>Email verification</div>
									<div className="info-link" onClick={verifyEmail}>
										Mark as verified
									</div>
								</div>
								<div>
									<ReactSVG
										src={STATIC_ICONS.USER_EMAIL_UNVERIFIED}
										className={'about-icon'}
									/>
								</div>
							</Fragment>
						)}
					</div>
					<div className="about-info d-flex align-items-center justify-content-center">
						{userData.otp_enabled ? (
							<Fragment>
								<div className="about-info-content">
									<div>2FA enabled</div>
									<div className="info-link" onClick={disableOTP}>
										Disable
									</div>
								</div>
								<div className={'about-icon-active'}>
									<ReactSVG
										src={STATIC_ICONS.TWO_STEP_KEY_ICON}
										className={'about-icon'}
									/>
								</div>
							</Fragment>
						) : (
							<Fragment>
								<div>
									<div>2FA disabled</div>
								</div>
								<div>
									<ReactSVG
										src={STATIC_ICONS.TWO_STEP_KEY_ICON}
										className={'about-icon'}
									/>
								</div>
							</Fragment>
						)}
					</div>
					<div className="about-info d-flex align-items-center justify-content-center">
						{!userData.activated ? (
							<Fragment>
								<div className="about-info-content">
									<div>Account frozen</div>
									<div
										className="info-link"
										onClick={() => freezeAccount(!userData.activated)}
									>
										Unfreeze
									</div>
								</div>
								<div className={'about-icon-active'}>
									<ReactSVG
										src={STATIC_ICONS.ACC_FREEZE}
										className={'about-icon'}
									/>
								</div>
							</Fragment>
						) : (
							<Fragment>
								<div>
									<div
										className="info-link"
										onClick={() => freezeAccount(!userData.activated)}
									>
										Freeze account
									</div>
								</div>
								<div>
									<ReactSVG
										src={STATIC_ICONS.ACC_FREEZE}
										className={'about-icon'}
									/>
								</div>
							</Fragment>
						)}
					</div>
					<div className="about-info d-flex align-items-center justify-content-center">
						{userData.flagged ? (
							<Fragment>
								<div className="about-info-content">
									<div>This user is flagged</div>
									<div
										className="info-link"
										onClick={() => flagUser(!userData.flagged)}
									>
										Unflag user
									</div>
								</div>
								<div className="about-icon-active">
									<ReactSVG
										src={STATIC_ICONS.ACC_FLAG}
										className={'about-icon'}
									/>
								</div>
							</Fragment>
						) : (
							<Fragment>
								<div>
									<div
										className="info-link"
										onClick={() => flagUser(!userData.flagged)}
									>
										Flag user
									</div>
								</div>
								<div>
									<ReactSVG
										src={STATIC_ICONS.ACC_FLAG}
										className={'about-icon'}
									/>
								</div>
							</Fragment>
						)}
					</div>
				</div>
			</div>
			<div className="about-wrapper">
				<div className="d-flex">
					<div className="about-verification-content">
						<div className="about-title">User identification files</div>
						<div className="d-flex justify-content-between verification-wrapper">
							<div className="d-flex">
								<Verification
									isUpload={isUpload}
									constants={constants}
									user_id={userData.id}
									userImages={userImages}
									userInformation={userData}
									refreshData={refreshData}
									closeUpload={() => setUpload(false)}
									kycPluginName={kycPluginName}
									requestUserData={requestUserData}
								/>
							</div>
							<div>
								<Button
									type="primary"
									className="green-btn"
									onClick={() => setUpload(true)}
								>
									Upload
								</Button>
							</div>
						</div>
					</div>
					<div className="about-notes-content">
						<div className="about-title">Notes</div>
						<div className="about-notes-text">{userData.note}</div>
						<div className="d-flex justify-content-end">
							<Button
								type="primary"
								size="small"
								danger
								onClick={handleNotesRemove}
							>
								Delete
							</Button>
							<div className="separator"></div>
							<Button
								type="primary"
								className="green-btn"
								size="small"
								onClick={() => handleOpenModal('notes')}
							>
								Edit
							</Button>
						</div>
					</div>
				</div>
				<div>
					<div className="about-title">User info</div>
					<div className="d-flex m-4">
						<div className="user-info-container">
							<DataDisplay data={userInfo} renderRow={renderRowInformation} />
							<div>
								<Button
									type="primary"
									className="green-btn"
									size="small"
									onClick={() => handleOpenModal('users')}
								>
									Edit
								</Button>
							</div>
						</div>
						<div className="user-info-separator"></div>
						<div className="user-role-container">
							<div>{renderIcons()}</div>
							<div className="user-info-label">Role: {renderRole()}</div>
							<div className="ml-4">
								<Link to="/admin/roles">
									<Button type="primary" className="green-btn" size="small">
										Edit
									</Button>
								</Link>
							</div>
						</div>
						<div className="user-info-separator"></div>
						<div className="user-level-container">
							<div>
								<Image
									icon={
										allIcons['dark'][
											`LEVEL_ACCOUNT_ICON_${userData.verification_level}`
										]
									}
									wrapperClassName="levels-icon"
								/>
							</div>
							<div className="user-info-label">
								Tier: {userData.verification_level}
							</div>
							<div className="ml-4">
								<Button
									type="primary"
									className="green-btn"
									size="small"
									onClick={() => handleOpenModal('verification-levels')}
								>
									Edit
								</Button>
							</div>
						</div>
						<div className="user-info-separator"></div>
					</div>
					<div className="m-4">
						{showRemaining ? (
							<DataDisplay data={rest} renderRow={renderRowInformation} />
						) : null}
						<div onClick={() => setShow(!showRemaining)}>
							{showRemaining ? (
								<Fragment>
									<span className="info-link">View less details</span>
									<CaretUpFilled />
								</Fragment>
							) : (
								<Fragment>
									<span className="info-link">View details</span>
									<CaretDownFilled />
								</Fragment>
							)}
						</div>
					</div>
				</div>
				<div>
					<div className="about-title">Audit</div>
					<Audits userId={userData.id} />
				</div>
				<div>
					<div className="about-title">Login</div>
					<Logins userId={userData.id} />
				</div>
				<Modal visible={isEdit || isApply} footer={null} onCancel={handleClose}>
					<RenderModalContent
						modalKey={modalKey}
						userData={userData}
						constants={constants}
						onChangeSuccess={onChangeSuccess}
						handleClose={handleClose}
						refreshData={refreshData}
						allIcons={allIcons}
						userTiers={userTiers}
						handleApply={handleApply}
						handleDiscount={handleDiscount}
					/>
				</Modal>
			</div>
		</div>
	);
};

export default withConfig(AboutData);
