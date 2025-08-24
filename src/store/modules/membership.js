import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from '@/firebase'
import { getCurrentMemberships } from '@/views/admin/util/member'
import { arrayUnion } from "firebase/firestore";

const membership = {
    state: {
        plans: [
            {
                plan: '',
                type: '',
                count: '0',
                duration: 0,
                price: '0',
            }
        ],
        userMemberships: [
            {
                plan: '',
                type: '',
                count: '0',
                price: '0',
                assignee: '',
                startDate: null,
                endDate: null,
                holdStartDate: null,
                holdEndDate: null,
                createdAt: null,
                updatedAt: null,
            }
        ],
        userCurrentMemberships: [],
    },
    mutations: {
        SET_MEMBERSHIP_PLANS(state, plans) {
            state.plans = plans;
        },
        ADD_MEMBERSHIP_PLAN(state, plan) {
            state.plans.push(plan);
        },
        REMOVE_MEMBERSHIP_PLAN(state, planName) {
            const index = state.plans.findIndex(plan => plan.plan === planName);
            if (index !== -1) {
                state.plans.splice(index, 1);
            }
        },

        SET_USER_MEMBERSHIPS(state, memberships) {
            state.userMemberships = memberships
        },
        ADD_USER_MEMBERSHIP(state, membership) {
            state.userMemberships.push(membership)
        },
        REMOVE_USER_MEMBERSHIP(state, index) {
            if (index !== -1) {
                state.userMemberships.splice(index, 1);
            }
        },

        SET_USER_CURRENT_MEMBERSHIP(state, memberships) {
            state.userCurrentMemberships = memberships
        },
    },
    actions: {
        async getMembershipPlans({ commit }) {
            const boxName = localStorage.getItem('boxName');
            try {
                const membershipDocRef = doc(db, `box/${boxName}/membership`, "plansDoc");
        
                const docSnap = await getDoc(membershipDocRef);
        
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    commit('SET_MEMBERSHIP_PLANS', data.plans)

                    return data.plans || [];
                } else {
                    console.log("No membership document found, returning empty array.");
                    return [];
                }
            } catch (error) {
                console.error("Error fetching membership plans:", error);
                return [];
            }
        },

        async setMembershipPlans({ commit }, { plans }) {
            const boxName = localStorage.getItem('boxName');
            try {
                const membershipDocRef = doc(db, `box/${boxName}/membership`, "plansDoc");

                const docSnap = await getDoc(membershipDocRef);

                if (!docSnap.exists()) {
                    await setDoc(membershipDocRef, { plans: plans });
                    console.log("Created new membership plan document.");
                } else {
                    await setDoc(membershipDocRef, { plans: plans }, { merge: true });
                    console.log("Updated existing membership plan document.");
                }

                commit("SET_MEMBERSHIP_PLANS", plans);
            } catch (error) {
                console.error("Error setting membership plans:", error);
            }
        },

        async addMembershipPlan({ commit, state }, { plan }) {
            try {
                const boxName = localStorage.getItem('boxName');
                if (!boxName) {
                    console.error("Error: boxName is missing");
                    return;
                }

                commit('ADD_MEMBERSHIP_PLAN', plan);

                await this.dispatch("setMembershipPlans", { boxName, plans: state.plans });
                console.log("Successfully added new membership plan:", plan);
            } catch (error) {
                console.error("Error adding membership plan:", error);
            }
        },

        async deleteMembershipPlan({ commit, state }, plan) {
            try {
                const boxName = localStorage.getItem('boxName');
                if (!boxName) {
                    console.error("Error: boxName is missing");
                    return;
                }
        
                commit("REMOVE_MEMBERSHIP_PLAN", plan);
        
                await this.dispatch("setMembershipPlans", { boxName, plans: state.plans });
        
                console.log("Successfully deleted membership plan:", plan);
            } catch (error) {
                console.error("Error deleting membership plan:", error);
            }
        },

        async getUserMemberships({ commit }, payload) {
            try {
                const boxName = localStorage.getItem('boxName')
                if (!boxName || !payload.email) {
                    console.warn('boxName 또는 email이 없습니다.')
                    return
                }

                const memberDocRef = doc(
                    db,
                    `box/${boxName}/member/${payload.email}`
                )

                const docSnap = await getDoc(memberDocRef)

                if (docSnap.exists()) {
                    const data = docSnap.data()
                    const memberships = data.memberships || []

                    commit('SET_USER_MEMBERSHIPS', memberships)

                    const currentMemberships = getCurrentMemberships(memberships)
                    commit('SET_USER_CURRENT_MEMBERSHIP', currentMemberships)
                    return memberships
                } else {
                    console.log('Member 문서를 찾을 수 없습니다.')
                    commit('SET_USER_MEMBERSHIPS', [])
                    commit('SET_USER_CURRENT_MEMBERSHIP', [])
                    return []
                }
            } catch (error) {
                console.error('회원권 정보 불러오기 중 오류 발생:', error)
                commit('SET_USER_MEMBERSHIPS', [])
                commit('SET_USER_CURRENT_MEMBERSHIP', [])
                return []
            }
        },

        // 매출 데이터 저장 함수
        async addRevenueData({ commit }, payload) {
            try {
                const boxName = localStorage.getItem('boxName')
                if (!boxName) {
                    console.error("Error: boxName is missing")
                    return
                }

                const yymm = `${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}`
                const day = new Date().getDate().toString().padStart(2, '0')
                
                const monetaryDocRef = doc(db, `box/${boxName}/monetary/${yymm}`)
                
                // 매출 데이터 구조 - undefined 값 체크 및 기본값 설정
                const revenueData = {
                    assignee: payload.membership.assignee || '',
                    createdAt: payload.membership.createdAt || new Date(),
                    paymentType: payload.membership.paymentType || '',
                    plan: payload.membership.plan || '',
                    type: payload.membership.type || '',
                    price: payload.membership.price || '0',
                    realName: payload.realName || '',
                    id: payload.email || ''
                }

                // undefined 값이 있는지 확인
                const hasUndefinedValues = Object.values(revenueData).some(value => value === undefined)
                if (hasUndefinedValues) {
                    console.error('Revenue data contains undefined values:', revenueData)
                    throw new Error('Revenue data contains undefined values')
                }

                // 기존 문서가 있으면 업데이트, 없으면 새로 생성
                await setDoc(monetaryDocRef, {
                    [day]: {
                        [payload.membership.key]: revenueData
                    }
                }, { merge: true })

                console.log('Successfully added revenue data for day:', day)
            } catch (error) {
                console.error('Error adding revenue data:', error)
                throw error
            }
        },

        async addUserMembership({ commit, state }, payload) {
            try {
                const boxName = localStorage.getItem('boxName')
                if (!boxName) {
                    console.error("Error: boxName is missing")
                    return
                }

                if (!payload.email || !payload.membership) {
                    console.error("Error: email or membership data is missing")
                    return
                }

                commit('ADD_USER_MEMBERSHIP', payload.membership)

                const memberDocRef = doc(
                    db,
                    `box/${boxName}/member/${payload.email}`
                )
                
                await setDoc(memberDocRef, {
                    memberships: state.userMemberships
                }, { merge: true })

                // 매출 데이터 저장
                await this.dispatch("addRevenueData", payload)

                console.log('Successfully added new user membership:', payload)
            } catch (error) {
                console.error('Error adding user membership:', error)
            }
        },

        async removeUserMembership({ commit, state }, payload) {
            try {
                const boxName = localStorage.getItem('boxName')
                if (!boxName) {
                    console.error("Error: boxName is missing")
                    return
                }

                if (payload.index === undefined || payload.email === undefined) {
                    console.error("Error: membership index or email is missing")
                    return
                }

                commit('REMOVE_USER_MEMBERSHIP', payload.index)
                const updatedMemberships = [...state.userMemberships]

                const membershipDocRef = doc(
                    db,
                    `box/${boxName}/member/${payload.email}`
                )
                
                await setDoc(membershipDocRef, {
                    memberships: updatedMemberships
                }, { merge: true })

                console.log('Successfully removed user membership at index:', payload.index)
            } catch (error) {
                console.error('Error removing user membership:', error)
                throw error
            }
        }

    },
    getters: {
        getMembershipPlans: (state) => state.plans,
    },
}


export default membership