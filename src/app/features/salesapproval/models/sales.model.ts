export interface Sales {
    userClientRoleId: number;
    saleDate: Date;
    transactionTypeId: number;
    fullCage: number;
    emptyCage: number;
    weight: number;
    rate: number;
    amount: number;
    amountPaid: number;
    dressingAmount: number;
    discountAmt: number;
    billNumber: string;
    balanceAmount: number;
    comments?: string; 
    updatedBy: number
    smsflag: boolean;
    cages: number;
}



